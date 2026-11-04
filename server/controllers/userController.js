const crypto = require('crypto');
const db = require('../db/database');
const ledgerService = require('../services/ledgerService');
const config = require('../config');

// Helper lấy ngày hiện tại định dạng YYYY-MM-DD theo múi giờ Việt Nam (UTC+7)
function getVietnamDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

// Helper tính ngày hôm trước theo chuỗi YYYY-MM-DD
function getVietnamYesterday(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Helper đếm số ngày chênh lệch giữa 2 chuỗi YYYY-MM-DD (gap = today - last)
function getDayGap(fromDateStr, toDateStr) {
  if (!fromDateStr || !toDateStr) return Infinity;
  const [fy, fm, fd] = fromDateStr.split('-').map(Number);
  const [ty, tm, td] = toDateStr.split('-').map(Number);
  const fromMs = Date.UTC(fy, fm - 1, fd);
  const toMs = Date.UTC(ty, tm - 1, td);
  return Math.round((toMs - fromMs) / 86400000);
}

// Helper lấy cấp bậc hệ số thưởng khảo sát theo số ngày chuỗi (ECONOMICS.STREAK.BONUS_TIERS)
function getStreakBonusTier(streakDays) {
  const tiers = (config.ECONOMICS && config.ECONOMICS.STREAK && config.ECONOMICS.STREAK.BONUS_TIERS) || [];
  return tiers.find(t => (Number(streakDays) || 0) >= t.minDay) || null;
}

// Helper dựng cấu hình milestone trả về client (ẩn nhạy cảm không cần thiết)
function getStreakMilestonesConfig() {
  const milestones = (config.ECONOMICS && config.ECONOMICS.STREAK && config.ECONOMICS.STREAK.MILESTONES) || {};
  return Object.keys(milestones).map(Number).sort((a, b) => a - b).map(day => ({
    day,
    points: milestones[day].points,
    freeze_tickets: milestones[day].freezeTickets || 0,
    badge: milestones[day].badge || null,
    avatar_frame: milestones[day].avatarFrame || null
  }));
}

// Bảng thưởng điểm theo chuỗi ngày (Gamification Streaks)
function getStreakReward(streakDay) {
  switch (streakDay) {
    case 1: return { points: 50, badge: null };
    case 2: return { points: 80, badge: null };
    case 3: return { points: 120, badge: null };
    case 4: return { points: 160, badge: null };
    case 5: return { points: 200, badge: null };
    case 6: return { points: 250, badge: null };
    case 7: return { points: 500, badge: 'Badge Tích Cực' };
    default: return { points: 200, badge: null }; // Duy trì từ ngày 8 trở đi: +200 Point/ngày
  }
}

class UserController {
  /**
   * GET /api/v1/users/streak-info
   * Lấy thông tin chuỗi ngày của user đăng nhập, trạng thái hôm nay đã điểm danh chưa,
   * phần thưởng hôm nay, lộ trình 7 ngày tới, Vé Cứu Chuỗi, hệ số thưởng khảo sát và Hộp Quà Cột Mốc.
   * Lưu ý: Hàm này CHỈ ĐỌC (non-destructive) — số vé sẽ bị trừ chỉ là preview, không ghi DB.
   */
  getStreakInfo(req, res) {
    try {
      const userId = req.user.id;
      const todayStr = getVietnamDateString();
      const yesterdayStr = getVietnamYesterday(todayStr);

      const streakRow = db.prepare(`
        SELECT id, user_id, current_streak, max_streak, last_checkin_date, total_points_earned,
               streak_freezes_count, claimed_milestones_json, updated_at
        FROM daily_streaks
        WHERE user_id = ?
      `).get(userId) || {
        current_streak: 0,
        max_streak: 0,
        last_checkin_date: null,
        total_points_earned: 0,
        streak_freezes_count: 0,
        claimed_milestones_json: '[]'
      };

      const hasCheckedInToday = streakRow.last_checkin_date === todayStr;
      const isStreakBroken = !hasCheckedInToday && streakRow.last_checkin_date !== null && streakRow.last_checkin_date !== yesterdayStr;

      // Xác định ngày chuỗi kế tiếp hoặc hiện tại
      let effectiveStreak = 1;
      if (hasCheckedInToday) {
        effectiveStreak = streakRow.current_streak;
      } else if (streakRow.last_checkin_date === yesterdayStr) {
        effectiveStreak = streakRow.current_streak + 1;
      } else {
        effectiveStreak = 1;
      }

      const todayReward = getStreakReward(effectiveStreak);

      // Xây dựng lộ trình 7 ngày
      const roadmap = [];
      for (let day = 1; day <= 7; day++) {
        const reward = getStreakReward(day);
        let status = 'LOCKED';

        if (hasCheckedInToday) {
          if (effectiveStreak >= 7) {
            status = 'CLAIMED';
          } else {
            status = day <= effectiveStreak ? 'CLAIMED' : 'LOCKED';
          }
        } else {
          if (effectiveStreak > 7) {
            status = 'CLAIMED';
          } else {
            if (day < effectiveStreak) {
              status = 'CLAIMED';
            } else if (day === effectiveStreak) {
              status = 'TODAY';
            } else {
              status = 'LOCKED';
            }
          }
        }

        roadmap.push({
          day,
          points: reward.points,
          badge: reward.badge,
          is_milestone: day === 7,
          status
        });
      }

      // --- Mở rộng Streak Benefits (KE_HOACH_UU_DAI_CHUOI_DIEM_DANH.md) ---
      const freezeCount = streakRow.streak_freezes_count || 0;
      const maxFreezeTickets = (config.ECONOMICS.STREAK && config.ECONOMICS.STREAK.MAX_FREEZE_TICKETS) || 2;

      let claimedMilestones = [];
      try {
        const parsed = JSON.parse(streakRow.claimed_milestones_json || '[]');
        if (Array.isArray(parsed)) claimedMilestones = parsed;
      } catch (e) { claimedMilestones = []; }

      // Cấp bậc hệ số thưởng theo chuỗi đã đạt
      const bonusTier = getStreakBonusTier(streakRow.current_streak);
      const multiplierPercent = bonusTier ? bonusTier.percent : 0;

      // Hộp quà cột mốc đạt điều kiện (chuỗi đủ ngày) nhưng CHƯA nhận — trả mốc CAO NHẤT
      const milestonesCfg = (config.ECONOMICS.STREAK && config.ECONOMICS.STREAK.MILESTONES) || {};
      const eligibleDays = Object.keys(milestonesCfg).map(Number)
        .filter(day => streakRow.current_streak >= day && !claimedMilestones.includes(day))
        .sort((a, b) => b - a);
      const eligibleUnclaimed = eligibleDays.length > 0 ? eligibleDays[0] : null;

      // Gate hoạt động thật: >= 1 phản hồi VALIDATED trong 7 ngày gần nhất
      let milestoneGatePassed = false;
      try {
        const gateRow = db.prepare(`
          SELECT COUNT(*) AS cnt FROM responses
          WHERE respondent_id = ? AND status = 'VALIDATED'
            AND submitted_at >= datetime('now', '-7 days')
        `).get(userId);
        milestoneGatePassed = (gateRow && gateRow.cnt > 0);
      } catch (gateErr) {
        milestoneGatePassed = false;
      }

      // Preview số vé SẼ bị trừ nếu điểm danh ngay bây giờ (không ghi DB)
      let pendingFreezeConsumption = 0;
      if (!hasCheckedInToday && streakRow.last_checkin_date) {
        const gap = getDayGap(streakRow.last_checkin_date, todayStr);
        if (gap === 2 && freezeCount >= 1) pendingFreezeConsumption = 1;
        else if (gap === 3 && freezeCount >= 2) pendingFreezeConsumption = 2;
        // gap > 3 hoặc thiếu vé: chuỗi sẽ reset nên không trừ vé (pending = 0)
      }

      return res.json({
        success: true,
        streak: {
          current_streak: streakRow.current_streak,
          max_streak: streakRow.max_streak,
          last_checkin_date: streakRow.last_checkin_date,
          total_points_earned: streakRow.total_points_earned,
          has_checked_in_today: hasCheckedInToday,
          is_streak_broken: isStreakBroken,
          today_date: todayStr,
          next_streak_day: effectiveStreak,
          today_reward_points: todayReward.points,
          today_badge: todayReward.badge,
          roadmap,
          // Streak Benefits
          streak_freezes_count: freezeCount,
          max_freeze_tickets: maxFreezeTickets,
          multiplier_percent: multiplierPercent,
          tier_level: bonusTier ? bonusTier.tierLevel : 1,
          tier_name: bonusTier ? bonusTier.tierName : 'Lửa Khởi Động',
          claimed_milestones: claimedMilestones,
          eligible_unclaimed_milestone: eligibleUnclaimed,
          milestone_gate_passed: milestoneGatePassed,
          pending_freeze_consumption: pendingFreezeConsumption,
          milestones: getStreakMilestonesConfig()
        }
      });
    } catch (err) {
      console.error('Lỗi getStreakInfo:', err);
      return res.status(500).json({ success: false, message: 'Lỗi tải thông tin chuỗi ngày điểm danh' });
    }
  }

  /**
   * POST /api/v1/users/checkin
   * Thực hiện điểm danh trong ngày (dựa theo ngày giờ VN UTC+7),
   * cộng điểm Point vào ví qua ledgerService, cập nhật daily_streaks, gửi thông báo vào notifications.
   * Vé Cứu Chuỗi (Streak Freeze - KE_HOACH_UU_DAI_CHUOI_DIEM_DANH.md): lazy-evaluation chỉ tác động tại checkin —
   * gap 2 ngày trừ 1 vé, gap 3 ngày trừ 2 vé để bảo toàn chuỗi; gap > 3 hoặc thiếu vé thì reset về Ngày 1.
   */
  checkin(req, res) {
    try {
      const userId = req.user.id;
      const todayStr = getVietnamDateString();
      const yesterdayStr = getVietnamYesterday(todayStr);
      const maxFreezeTickets = (config.ECONOMICS.STREAK && config.ECONOMICS.STREAK.MAX_FREEZE_TICKETS) || 2;

      const streakRow = db.prepare(`
        SELECT id, user_id, current_streak, max_streak, last_checkin_date, total_points_earned, streak_freezes_count
        FROM daily_streaks
        WHERE user_id = ?
      `).get(userId);

      // Chặn điểm danh trùng lặp trong cùng 1 ngày
      if (streakRow && streakRow.last_checkin_date === todayStr) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã hoàn thành điểm danh ngày hôm nay rồi. Hãy quay lại vào ngày mai!'
        });
      }

      // Tính toán số ngày chuỗi mới + cơ chế Vé Cứu Chuỗi (lazy freeze engine)
      let newStreak = 1;
      let freezeUsed = 0;
      let currentFreezeCount = streakRow ? (streakRow.streak_freezes_count || 0) : 0;

      if (streakRow && streakRow.last_checkin_date) {
        const gap = getDayGap(streakRow.last_checkin_date, todayStr);
        if (gap === 1) {
          // Nối chuỗi bình thường (điểm danh hôm qua)
          newStreak = streakRow.current_streak + 1;
        } else if (gap === 2 && currentFreezeCount >= 1) {
          // Lỡ 1 ngày: dùng 1 Vé Cứu Chuỗi bảo toàn chuỗi
          newStreak = streakRow.current_streak + 1;
          freezeUsed = 1;
        } else if (gap === 3 && currentFreezeCount >= 2) {
          // Lỡ 2 ngày: dùng 2 Vé Cứu Chuỗi bảo toàn chuỗi
          newStreak = streakRow.current_streak + 1;
          freezeUsed = 2;
        } else {
          // Đứt chuỗi (gap > 3 hoặc không đủ vé): reset về Ngày 1
          newStreak = 1;
        }
      }

      const reward = getStreakReward(newStreak);

      // 0. Khấu trừ Vé Cứu Chuỗi nguyên tử (UPDATE có điều kiện chống race)
      if (freezeUsed > 0) {
        const consumeFreeze = db.prepare(`
          UPDATE daily_streaks
          SET streak_freezes_count = streak_freezes_count - ?, last_freeze_used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND streak_freezes_count >= ?
        `).run(freezeUsed, userId, freezeUsed);
        if (consumeFreeze.changes === 0) {
          // Race condition: vé đã bị dùng ở luồng khác -> chấp nhận reset chuỗi
          freezeUsed = 0;
          newStreak = 1;
        } else {
          currentFreezeCount = currentFreezeCount - freezeUsed;
        }
      }

      // 1. Cộng điểm vào ví thông qua ledgerService
      const ledgerResult = ledgerService.rewardDailyStreak(userId, reward.points, newStreak, todayStr);

      // 2. Cập nhật bảng daily_streaks nguyên tử (giữ nguyên claimed_milestones_json qua UPDATE path)
      const currentMax = streakRow ? streakRow.max_streak : 0;
      const newMax = Math.max(currentMax, newStreak);
      const newFreezeCount = Math.max(0, currentFreezeCount - freezeUsed);

      db.prepare(`
        INSERT INTO daily_streaks (user_id, current_streak, max_streak, last_checkin_date, total_points_earned, streak_freezes_count, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          current_streak = excluded.current_streak,
          max_streak = MAX(daily_streaks.max_streak, excluded.max_streak),
          last_checkin_date = excluded.last_checkin_date,
          total_points_earned = daily_streaks.total_points_earned + excluded.total_points_earned,
          streak_freezes_count = excluded.streak_freezes_count,
          updated_at = CURRENT_TIMESTAMP
      `).run(userId, newStreak, newMax, todayStr, reward.points, newFreezeCount);

      // 3. Gửi thông báo vào bảng notifications
      const notifId = crypto.randomUUID();
      const notifTitle = newStreak === 7
        ? '[Điểm Danh] Chúc mừng! Đạt Mốc Vàng 7 ngày liên tiếp'
        : (freezeUsed > 0
          ? '[Điểm Danh] Vé Cứu Chuỗi đã bảo vệ ngọn lửa của bạn'
          : `[Điểm Danh] Duy trì chuỗi ${newStreak} ngày thành công`);
      const notifMsg = newStreak === 7
        ? `Bạn đã xuất sắc hoàn thành chuỗi 7 ngày liên tiếp, nhận +${reward.points} Point và mở khóa Badge Tích Cực!`
        : (freezeUsed > 0
          ? `SurvHub đã tự động sử dụng ${freezeUsed} Vé Cứu Chuỗi để bảo vệ chuỗi ${newStreak} ngày của bạn (còn ${newFreezeCount} vé). Nhận +${reward.points} Point điểm danh hôm nay.`
          : `Bạn đã điểm danh thành công Ngày ${newStreak} và nhận được +${reward.points} Point vào ví thưởng.`);

      db.prepare(`
        INSERT INTO notifications (id, user_id, survey_id, type, title, message, channel)
        VALUES (?, ?, null, 'DAILY_STREAK', ?, ?, 'ALL')
      `).run(notifId, userId, notifTitle, notifMsg);

      return res.json({
        success: true,
        message: newStreak === 7
          ? `Chúc mừng bạn đã đạt Mốc Vàng 7 ngày liên tiếp! Nhận +${reward.points} Point và Badge Tích Cực.`
          : (freezeUsed > 0
            ? `Đã dùng ${freezeUsed} Vé Cứu Chuỗi bảo vệ chuỗi ${newStreak} ngày! Nhận +${reward.points} Point.`
            : `Điểm danh Ngày ${newStreak} thành công! Nhận +${reward.points} Point.`),
        streak: {
          current_streak: newStreak,
          max_streak: newMax,
          last_checkin_date: todayStr,
          points_earned: reward.points,
          badge: reward.badge,
          new_point_balance: ledgerResult.newPointBalance,
          freeze_used: freezeUsed,
          freeze_remaining: newFreezeCount
        }
      });
    } catch (err) {
      console.error('Lỗi checkin:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi xử lý điểm danh hàng ngày'
      });
    }
  }

  /**
   * POST /api/v1/users/streak-claim-milestone
   * Nhận Hộp Quà Cột Mốc chuỗi điểm danh (10/50/100/200 ngày).
   * Điều kiện: chuỗi hiện tại >= cột mốc, chưa nhận, qua gate hoạt động
   * (>= 1 phản hồi VALIDATED trong 7 ngày gần nhất) và không phải Creator/Doanh nghiệp.
   */
  claimMilestone(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role || 'RESPONDENT';

      // Chốt phân quyền: Creator/Doanh nghiệp không tham gia chương trình đáp viên
      if (userRole === 'ENTERPRISE' || userRole === 'CREATOR') {
        return res.status(403).json({ success: false, message: 'Chương trình Hộp Quà Cột Mốc chỉ áp dụng cho Người Điền khảo sát' });
      }

      const milestoneDay = parseInt(req.body && req.body.milestone_day, 10);
      const milestonesCfg = (config.ECONOMICS.STREAK && config.ECONOMICS.STREAK.MILESTONES) || {};
      const milestoneCfg = milestonesCfg[milestoneDay];
      if (!milestoneCfg) {
        return res.status(400).json({ success: false, message: 'Cột mốc không hợp lệ' });
      }

      // Kiểm tra chuỗi đạt mốc trước khi đụng ledger
      const streakRow = db.prepare('SELECT current_streak FROM daily_streaks WHERE user_id = ?').get(userId);
      if (!streakRow || (streakRow.current_streak || 0) < milestoneDay) {
        return res.status(400).json({ success: false, message: `Chuỗi điểm danh chưa đạt ${milestoneDay} ngày` });
      }

      // Kiểm tra đã nhận chưa
      let claimedMilestones = [];
      const claimedRow = db.prepare('SELECT claimed_milestones_json FROM daily_streaks WHERE user_id = ?').get(userId);
      try {
        const parsed = JSON.parse((claimedRow && claimedRow.claimed_milestones_json) || '[]');
        if (Array.isArray(parsed)) claimedMilestones = parsed;
      } catch (e) { claimedMilestones = []; }
      if (claimedMilestones.includes(milestoneDay)) {
        return res.status(400).json({ success: false, message: 'Bạn đã nhận Hộp Quà cột mốc này rồi' });
      }

      // Gate chống farm: cần >= 1 phản hồi VALIDATED trong 7 ngày gần nhất
      const gateDays = Math.max(1, parseInt((config.ECONOMICS.STREAK && config.ECONOMICS.STREAK.MILESTONE_ACTIVITY_GATE_DAYS) || 7, 10) || 7);
      const gateRow = db.prepare(`
        SELECT COUNT(*) AS cnt FROM responses
        WHERE respondent_id = ? AND status = 'VALIDATED'
          AND submitted_at >= datetime('now', '-${gateDays} days')
      `).get(userId);
      if (!gateRow || gateRow.cnt <= 0) {
        return res.status(403).json({
          success: false,
          message: `Cần hoàn thành ít nhất 1 khảo sát hợp lệ trong ${gateDays} ngày gần nhất để nhận Hộp Quà Cột Mốc`,
          milestone_gate_passed: false
        });
      }

      // Gọi ledger ACID (chống nhận trùng lần 2 trong transaction)
      const maxFreezeTickets = (config.ECONOMICS.STREAK && config.ECONOMICS.STREAK.MAX_FREEZE_TICKETS) || 2;
      const result = ledgerService.rewardStreakMilestone(userId, milestoneDay, milestoneCfg, maxFreezeTickets);

      // Thông báo chúc mừng
      const notifId = crypto.randomUUID();
      const rewardDesc = [];
      if (result.points_awarded > 0) rewardDesc.push(`+${result.points_awarded.toLocaleString('vi-VN')} Point`);
      if (result.freeze_tickets_awarded > 0) rewardDesc.push(`${result.freeze_tickets_awarded} Vé Cứu Chuỗi`);
      if (result.badge) rewardDesc.push(`Huy hiệu "${result.badge}"`);
      if (result.avatar_frame) rewardDesc.push('Khung Avatar Neon');

      db.prepare(`
        INSERT INTO notifications (id, user_id, survey_id, type, title, message, channel)
        VALUES (?, ?, null, 'DAILY_STREAK', ?, ?, 'ALL')
      `).run(
        notifId,
        userId,
        `[Hộp Quà] Chúc mừng đạt cột mốc ${milestoneDay} ngày!`,
        `Bạn đã nhận Hộp Quà Cột Mốc ${milestoneDay} ngày: ${rewardDesc.join(', ')}.`
      );

      return res.json({
        success: true,
        message: `Chúc mừng! Bạn đã nhận Hộp Quà Cột Mốc ${milestoneDay} ngày.`,
        ...result
      });
    } catch (err) {
      console.error('Lỗi claimMilestone:', err);
      return res.status(err.message && err.message.includes('chưa đạt') ? 400 : 500).json({
        success: false,
        message: err.message || 'Lỗi nhận Hộp Quà Cột Mốc'
      });
    }
  }
}

module.exports = new UserController();
