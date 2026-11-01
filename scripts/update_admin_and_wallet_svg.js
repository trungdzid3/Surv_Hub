const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'public', 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

// 1. Cập nhật switchAdminMode và switchAdminTier
const startMarker = 'switchAdminViewMode(mode) {';
const endMarker = '  logout() {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Không tìm thấy khối switchAdminViewMode hoặc logout!');
  process.exit(1);
}

const newAdminCode = `switchAdminViewMode(mode) {
    return this.switchAdminMode(mode);
  },

  async switchAdminMode(mode) {
    this.haptic('medium');
    this.state.adminViewMode = mode;
    this.state.adminMode = mode;
    localStorage.setItem('survhub_admin_view_mode', mode);

    if (mode === 'RESPONDENT') {
      this.showToast('Đã chuyển sang góc nhìn Người Điền (Đáp Viên)', 'info');
      // Người điền chỉ là Người Điền Thường (PERSONAL) hoặc Sinh Viên (STUDENT), tuyệt đối không nhận Doanh Nghiệp
      if (this.state.currentUser && this.state.currentUser.account_tier === 'ENTERPRISE') {
        await this.switchAdminTier('PERSONAL', true);
      }
      this.renderNavigation();
      this.renderUserProfileDropdown();

      if (['admin-overview', 'admin-payouts', 'admin-fraud'].includes(this.state.currentTab)) {
        await this.navigate('surveys');
      } else if (this.state.currentTab === 'create-survey') {
        if (!this.refreshStudioSidebarView()) {
          await this.navigate('create-survey');
        }
      } else {
        await this.navigate(this.state.currentTab);
      }
    } else if (mode === 'CREATOR') {
      this.showToast('Đã chuyển sang góc nhìn Doanh Nghiệp', 'info');
      // Tự động chuyển gói tài khoản sang Doanh Nghiệp (ENTERPRISE) nhưng tắt toast thứ 2 để không bị thông báo kép
      await this.switchAdminTier('ENTERPRISE', true);
      this.renderNavigation();
      this.renderUserProfileDropdown();

      if (['admin-overview', 'admin-payouts', 'admin-fraud'].includes(this.state.currentTab)) {
        await this.navigate('creator-surveys');
      } else if (this.state.currentTab === 'create-survey') {
        if (!this.refreshStudioSidebarView()) {
          await this.navigate('create-survey');
        }
      } else {
        await this.navigate(this.state.currentTab);
      }
    } else {
      this.showToast('Đã quay lại góc nhìn Quản Trị Viên (Toàn quyền)', 'info');
      this.renderNavigation();
      this.renderUserProfileDropdown();

      if (this.state.currentTab === 'create-survey') {
        if (!this.refreshStudioSidebarView()) {
          await this.navigate('create-survey');
        }
      } else {
        await this.navigate(this.state.currentTab);
      }
    }
  },

  async switchAdminTier(tier, silent = false) {
    this.haptic('medium');
    try {
      const res = await this.api('/admin/switch-tier', {
        method: 'POST',
        body: JSON.stringify({ tier })
      });
      if (res && res.success) {
        if (this.state.currentUser) {
          this.state.currentUser.account_tier = res.tier;
          if (res.user) {
            Object.assign(this.state.currentUser, res.user);
          }
          localStorage.setItem('survhub_cached_user', JSON.stringify(this.state.currentUser));
        }
        this.state.creatorTier = res.tier;
        delete this.state.customPricePerResponse;

        if (!silent) {
          const tierLabel = res.tier === 'ENTERPRISE' ? 'Doanh Nghiệp' : (res.tier === 'STUDENT' ? 'Sinh Viên' : 'Cá Nhân');
          this.showToast(res.message || \`Đã chuyển sang gói \${tierLabel}\`, 'success');
        }

        this.renderUserProfileDropdown();
        this.renderNavigation();

        // Chỉ tự động điều phối re-render tab khi đổi tier trực tiếp (không ở chế độ silent)
        if (!silent) {
          if (this.state.currentTab === 'create-survey') {
            if (!this.refreshStudioSidebarView()) {
              await this.navigate('create-survey');
            }
          } else {
            await this.navigate(this.state.currentTab);
          }
        }
      }
    } catch (err) {
      if (!silent) {
        this.showToast(err.message || 'Lỗi chuyển đổi phân hạng gói tài khoản', 'error');
      }
    }
  },

`;

content = content.substring(0, startIndex) + newAdminCode + content.substring(endIndex);

// 2. Cập nhật vị trí và kích thước của SVG Ví da và Xu & Voucher trong thẻ Bento trang Ví
const walletTargetRegex = /\$\{\!isStudent \? '<img src="\/assets\/3d\/wallet_3d_master\.svg"[^>]+>' : ''\}/;
const coinsTargetRegex = /\$\{\!isStudent \? '<img src="\/assets\/3d\/coins_coupon_3d_master\.svg"[^>]+>' : ''\}/;

const newWalletTag = "${!isStudent ? '<img src=\"/assets/3d/wallet_3d_master.svg\" class=\"absolute right-2 sm:right-5 top-2 sm:top-4 w-44 sm:w-52 h-auto object-contain pointer-events-none select-none z-0 opacity-75 dark:opacity-50 drop-shadow-sm\" alt=\"3D Orange Wallet\" />' : ''}";
const newCoinsTag = "${!isStudent ? '<img src=\"/assets/3d/coins_coupon_3d_master.svg\" class=\"absolute right-2 sm:right-5 top-2 sm:top-4 w-44 sm:w-52 h-auto object-contain pointer-events-none select-none z-0 opacity-90 dark:opacity-75 drop-shadow-sm\" alt=\"3D Coins and Coupon\" />' : ''}";

if (!walletTargetRegex.test(content)) {
  console.error('Không tìm thấy walletTargetRegex trong app.js');
  process.exit(1);
}
if (!coinsTargetRegex.test(content)) {
  console.error('Không tìm thấy coinsTargetRegex trong app.js');
  process.exit(1);
}

content = content.replace(walletTargetRegex, newWalletTag);
content = content.replace(coinsTargetRegex, newCoinsTag);

fs.writeFileSync(appJsPath, content, 'utf8');
console.log('Đã cập nhật thành công public/app.js!');
