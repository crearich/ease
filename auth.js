// 全局变量声明
let userStorage;
let verificationManager;

// 用户数据存储类
class UserStorage {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    // 保存用户数据
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // 保存当前用户
    saveCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    // 注册用户
    registerUser(userData) {
        // 检查手机号是否已存在
        if (this.users.find(user => user.phone === userData.phone)) {
            throw new Error('该手机号已被注册');
        }

        // 检查用户名是否已存在
        if (this.users.find(user => user.username === userData.username)) {
            throw new Error('用户名已存在');
        }

        // 检查邮箱是否已存在
        if (this.users.find(user => user.email === userData.email)) {
            throw new Error('该邮箱已被注册');
        }

        const newUser = {
            id: Date.now(),
            username: userData.username,
            phone: userData.phone,
            email: userData.email,
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();
        return newUser;
    }

    // 用户登录
    loginUser(phone) {
        const user = this.users.find(user => user.phone === phone);
        if (!user) {
            throw new Error('用户不存在，请先注册');
        }
        return user;
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 登出
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }
}

// 验证码管理类
class VerificationManager {
    constructor() {
        this.codes = {};
    }

    // 生成验证码
    generateCode(phone) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        this.codes[phone] = {
            code: code,
            timestamp: Date.now(),
            used: false
        };
        return code;
    }

    // 验证验证码
    verifyCode(phone, inputCode) {
        const codeData = this.codes[phone];
        if (!codeData) {
            throw new Error('请先获取验证码');
        }

        if (codeData.used) {
            throw new Error('验证码已使用');
        }

        // 验证码5分钟有效期
        if (Date.now() - codeData.timestamp > 5 * 60 * 1000) {
            throw new Error('验证码已过期');
        }

        if (codeData.code !== inputCode) {
            throw new Error('验证码错误');
        }

        codeData.used = true;
        return true;
    }
}

// 初始化管理器
function initializeManagers() {
    userStorage = new UserStorage();
    verificationManager = new VerificationManager();
}

// 发送验证码
function sendVerificationCode(phoneInputId, buttonId) {
    // 确保管理器已初始化
    if (!verificationManager) {
        initializeManagers();
    }

    const phoneInput = document.getElementById(phoneInputId);
    const button = document.getElementById(buttonId);
    const phone = phoneInput.value.trim();

    console.log('尝试发送验证码到:', phone);

    // 验证手机号是否为空
    if (!phone) {
        showError(phoneInputId + '-error', '请输入手机号');
        return;
    }

    // 验证手机号格式
    if (!validatePhone(phone)) {
        showError(phoneInputId + '-error', '请输入正确的手机号格式');
        return;
    }

    try {
        const code = verificationManager.generateCode(phone);
        
        // 模拟发送验证码（实际应用中应该调用短信API）
        alert(`验证码已发送到 ${phone}：${code}\n\n请复制此验证码到输入框中`);
        
        // 按钮倒计时
        startCountdown(button);
        
        // 清除错误信息
        clearError(phoneInputId + '-error');
        
        console.log('验证码发送成功:', code);
        
    } catch (error) {
        console.error('发送验证码失败:', error);
        showError(phoneInputId + '-error', error.message);
    }
}

// 处理注册
function handleRegister(event) {
    event.preventDefault();
    clearErrors();

    // 确保管理器已初始化
    if (!userStorage || !verificationManager) {
        initializeManagers();
    }

    const username = document.getElementById('register-username').value;
    const phone = document.getElementById('register-phone').value;
    const email = document.getElementById('register-email').value;
    const code = document.getElementById('register-code').value;

    // 验证输入
    let hasError = false;

    if (!username.trim()) {
        showError('register-username-error', '请输入用户名');
        hasError = true;
    }

    if (!validatePhone(phone)) {
        showError('register-phone-error', '请输入正确的手机号');
        hasError = true;
    }

    if (!validateEmail(email)) {
        showError('register-email-error', '请输入正确的邮箱');
        hasError = true;
    }

    if (!code.trim()) {
        showError('register-code-error', '请输入验证码');
        hasError = true;
    }

    if (hasError) return;

    try {
        // 验证验证码
        verificationManager.verifyCode(phone, code);

        // 注册用户
        const userData = { username, phone, email };
        const newUser = userStorage.registerUser(userData);

        // 自动登录
        userStorage.saveCurrentUser(newUser);

        // 注册成功提示
        alert('注册成功！');
        
        // 可以在这里添加页面跳转逻辑
        // window.location.href = '/home.html';

    } catch (error) {
        if (error.message.includes('验证码')) {
            showError('register-code-error', error.message);
        } else {
            showError('register-phone-error', error.message);
        }
    }
}

// 倒计时功能
function startCountdown(button) {
    let countdown = 60;
    button.disabled = true;
    button.textContent = `${countdown}秒`;

    const timer = setInterval(() => {
        countdown--;
        button.textContent = `${countdown}秒`;

        if (countdown <= 0) {
            clearInterval(timer);
            button.disabled = false;
            button.textContent = '发送验证码';
        }
    }, 1000);
}

// 验证函数
function validatePhone(phone) {
    if (!phone || phone.trim() === '') {
        return false;
    }
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone.trim());
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 错误处理
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(element => {
        element.textContent = '';
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeManagers();
});