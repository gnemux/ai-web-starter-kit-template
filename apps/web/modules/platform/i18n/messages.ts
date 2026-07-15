export const supportedLocales = ["en-US", "zh-CN"] as const;
export type AppLocale = (typeof supportedLocales)[number];

export const platformMessages = {
  "en-US": {
    language: "Language", english: "English", chinese: "中文", primaryNavigation: "Primary navigation", footerNavigation: "Footer navigation", homeLinkLabel: "home",
    signIn: "Sign in", signingIn: "Signing in…", createAccount: "Create account", creatingAccount: "Creating account…", sendingReset: "Sending reset email…", email: "Email", password: "Password", confirmPassword: "Confirm password", passwordHint: "Use at least 8 characters.",
    authModeLabel: "Account access", signInMode: "Sign in", signUpMode: "Create account", signUpDescription: "Create a protected account for this product.", resetMode: "Reset password", resetDescription: "Enter the account email to receive a secure reset link.", forgotPassword: "Forgot password?", backToSignIn: "Back to sign in",
    resetPassword: "Send reset email", resetRequested: "If the account exists, a reset link has been sent. In local development, open Mailpit to continue.", resetFailed: "The reset request could not be sent. Wait a moment and try again.",
    updatePassword: "Set new password", updatePasswordDescription: "Choose a new password for the signed-in recovery session.", passwordUpdated: "Your password has been updated.", passwordUpdateFailed: "The password could not be updated. Request a fresh reset link and try again.",
    authUnavailable: "Authentication is not configured for this local candidate. Start the isolated Supabase environment before signing in.",
    authRejected: "Authentication is unavailable or the submitted credentials were not accepted.", invalidCredentials: "The email and password do not match. Try again or reset the password.", invalidSignup: "Enter a valid email and matching passwords with at least 8 characters.", signupFailed: "The account could not be created. Sign in if the email is already registered, or try again.", confirmationFailed: "The email link is invalid or expired. Request a new link and try again.", checkEmail: "Check your email to confirm the new account, then return to sign in.",
    foundationState: "Foundation state", authenticationReady: "Authentication ready", safeLocalMode: "Safe local mode",
    authenticationReadyDescription: "The call to action follows the current authenticated account.", safeLocalModeDescription: "Provider credentials are optional and missing capabilities fail safely.",
    signedIn: "Signed in", displayName: "Display name", displayNameHint: "Optional, up to 120 characters.", saveProfile: "Save profile", saving: "Saving…", signOut: "Sign out",
    profileSaved: "Profile saved.", profileFailed: "The profile could not be saved. Review the value and try again.",
    authNotConfigured: "Authentication not configured", authNotConfiguredDescription: "Add this product's public Supabase values to enable account sessions.",
    productBoundary: "Product-owned module", productDescription: "Routes stay thin while product copy, workflows and adapters remain inside the product module.",
    workspaceOverview: "Overview", workspaceAccount: "Account", workspaceTitle: "Product foundation", workspaceDescription: "Start the first real customer workflow without changing platform internals.",
    readyTitle: "Ready for a real customer journey", readyDescription: "Replace this neutral module with product behavior while keeping platform contracts intact.",
    capabilityRegistry: "Capability registry", capabilityHelp: "Why are capability states explicit?", capabilityHelpText: "Disabled capabilities stay off; safe adapters are testable; external modes report missing configuration instead of pretending to work.",
    interactionTitle: "UI interaction contract", interactionDescription: "These controls demonstrate shared UI behavior only. They do not claim a saved business fact.", reviewInteraction: "Review interaction", interactionConfirmed: "Interaction completed locally; no business data was written.", dialogTitle: "Shared presentation, product-owned command", dialogDescription: "A real product owns authorization and persistence. The shared UI owns focus, dismissal and accessible presentation.", close: "Close", closeDialog: "Close dialog", dismissNotification: "Dismiss notification", previewWorkflow: "Workflow preview", previewWorkflowValue: "Describe the first complete customer journey.", previewState: "Preview state", previewDraft: "Draft", previewReady: "Ready for review", previewReview: "Require human review before external side effects", previewProgress: "UI asset coverage",
    capabilityAnalytics: "Analytics", capabilityPayment: "Payment", capabilityAi: "AI", modeDisabled: "Disabled", modeSandbox: "Sandbox", modeMock: "Mock", modeExternal: "External", stateEnabled: "Ready", stateDisabledCapability: "Disabled", stateNotConfigured: "Configuration required", stateNotImplemented: "Adapter required", stateCapabilityError: "Error",
    externalConfigurationRequires: "Required environment configuration:",
    billing: "Billing", billingDescription: "A product-configured surface over trusted server-side billing facts.", paymentDisabled: "Payment disabled", paymentDisabledDescription: "Enable sandbox for safe product testing or configure a reviewed external provider.", paymentIncomplete: "Payment configuration incomplete", paymentNotImplemented: "External payment adapter not implemented", paymentSandboxReady: "Payment sandbox ready", paymentSandboxReadyDescription: "A safe checkout preview is available. No external charge will be created.",
    usage: "Usage", usageDescription: "Usage and credit state belongs to the authenticated owner and server ledger.", aiDisabled: "AI disabled", aiDisabledDescription: "Enable mock for safe workflow testing or configure a reviewed external provider.", aiIncomplete: "AI configuration incomplete", aiNotImplemented: "External AI adapter not implemented", aiMockReady: "AI mock ready", aiMockReadyDescription: "A deterministic preview is available. No billable request or usage write will be created.",
    loading: "Loading", loadingDescription: "Preparing the requested view.", pageNotFound: "Page not found", pageNotFoundDescription: "This route does not exist in the current product.", returnHome: "Return home", somethingWrong: "Something went wrong", somethingWrongDescription: "The request could not be completed safely.", tryAgain: "Try again",
    stateLoading: "loading", stateEmpty: "empty", stateError: "error", stateForbidden: "forbidden", stateDisabled: "disabled"
  },
  "zh-CN": {
    language: "语言", english: "English", chinese: "中文", primaryNavigation: "主导航", footerNavigation: "页脚导航", homeLinkLabel: "首页",
    signIn: "登录", signingIn: "登录中…", createAccount: "创建账户", creatingAccount: "正在创建账户…", sendingReset: "正在发送重置邮件…", email: "邮箱", password: "密码", confirmPassword: "确认密码", passwordHint: "至少使用 8 个字符。",
    authModeLabel: "账户访问", signInMode: "登录", signUpMode: "创建账户", signUpDescription: "为当前产品创建受保护的个人账户。", resetMode: "重置密码", resetDescription: "输入账户邮箱以接收安全的重置链接。", forgotPassword: "忘记密码？", backToSignIn: "返回登录",
    resetPassword: "发送重置邮件", resetRequested: "如果账户存在，重置链接已经发送。本地开发时请打开 Mailpit 继续。", resetFailed: "暂时无法发送重置请求，请稍后重试。",
    updatePassword: "设置新密码", updatePasswordDescription: "为当前已验证的找回密码会话设置新密码。", passwordUpdated: "密码已更新。", passwordUpdateFailed: "密码更新失败，请重新申请重置链接后再试。",
    authUnavailable: "当前本地候选尚未配置登录能力。请先启动隔离的 Supabase 环境。",
    authRejected: "登录服务不可用，或提交的账号信息未通过验证。", invalidCredentials: "邮箱与密码不匹配，请重试或重置密码。", invalidSignup: "请输入有效邮箱，并确认两次输入的是同一个至少 8 位密码。", signupFailed: "账户创建失败。如果邮箱已经注册请直接登录，否则请重试。", confirmationFailed: "邮件链接无效或已经过期，请重新申请。", checkEmail: "请检查邮箱完成账户确认，然后返回登录。",
    foundationState: "底座状态", authenticationReady: "登录能力已就绪", safeLocalMode: "安全本地模式",
    authenticationReadyDescription: "首页入口会根据当前登录状态进入对应页面。", safeLocalModeDescription: "可选 Provider 缺失时会明确降级，不会伪造成功。",
    signedIn: "已登录", displayName: "显示名称", displayNameHint: "可选，最多 120 个字符。", saveProfile: "保存资料", saving: "保存中…", signOut: "退出登录",
    profileSaved: "资料已保存。", profileFailed: "资料保存失败，请检查内容后重试。",
    authNotConfigured: "尚未配置登录能力", authNotConfiguredDescription: "配置该产品的 Supabase 公开参数后即可启用账户会话。",
    productBoundary: "产品自有模块", productDescription: "路由保持薄层，产品文案、流程和适配器由产品模块负责。",
    workspaceOverview: "概览", workspaceAccount: "账户", workspaceTitle: "产品基础能力", workspaceDescription: "无需修改平台内部代码，即可开始第一个真实客户流程。",
    readyTitle: "可以开始真实产品旅程", readyDescription: "在产品模块中替换这份中性内容，同时保持平台契约稳定。",
    capabilityRegistry: "能力注册表", capabilityHelp: "为什么要明确显示能力状态？", capabilityHelpText: "关闭的能力不会偷偷运行；安全适配器可测试；外部模式配置不完整时会明确报错。",
    interactionTitle: "UI 交互契约", interactionDescription: "这些控件只验证共享 UI 行为，不代表业务数据已经保存。", reviewInteraction: "检查交互", interactionConfirmed: "本地交互已完成，没有写入业务数据。", dialogTitle: "共享展示，产品负责命令", dialogDescription: "真实产品负责授权和持久化，共享 UI 负责焦点、关闭和无障碍展示。", close: "关闭", closeDialog: "关闭对话框", dismissNotification: "关闭通知", previewWorkflow: "流程预览", previewWorkflowValue: "描述第一个完整的客户旅程。", previewState: "预览状态", previewDraft: "草稿", previewReady: "待审核", previewReview: "外部副作用发生前必须人工审核", previewProgress: "UI 资产覆盖",
    capabilityAnalytics: "数据分析", capabilityPayment: "支付", capabilityAi: "智能能力", modeDisabled: "已关闭", modeSandbox: "沙盒", modeMock: "模拟", modeExternal: "外部服务", stateEnabled: "已就绪", stateDisabledCapability: "已关闭", stateNotConfigured: "需要配置", stateNotImplemented: "需要接入适配器", stateCapabilityError: "异常",
    externalConfigurationRequires: "需要配置以下环境变量：",
    billing: "计费", billingDescription: "建立在可信服务端计费事实上的产品配置界面。", paymentDisabled: "支付已关闭", paymentDisabledDescription: "可启用沙盒安全测试，或配置经过审核的外部支付服务。", paymentIncomplete: "支付配置不完整", paymentNotImplemented: "尚未实现外部支付适配器", paymentSandboxReady: "支付沙盒已就绪", paymentSandboxReadyDescription: "可以安全预览结账流程，不会产生外部扣款。",
    usage: "用量", usageDescription: "用量和额度属于已登录用户及服务端账本事实。", aiDisabled: "智能能力已关闭", aiDisabledDescription: "可启用模拟模式安全测试，或配置经过审核的外部智能服务。", aiIncomplete: "智能能力配置不完整", aiNotImplemented: "尚未实现外部智能能力适配器", aiMockReady: "智能能力模拟模式已就绪", aiMockReadyDescription: "可以查看稳定的模拟结果，不会产生计费请求或写入用量。",
    loading: "加载中", loadingDescription: "正在准备请求的页面。", pageNotFound: "页面不存在", pageNotFoundDescription: "当前产品中没有这个路由。", returnHome: "返回首页", somethingWrong: "出现问题", somethingWrongDescription: "当前请求未能安全完成。", tryAgain: "重试",
    stateLoading: "加载中", stateEmpty: "空状态", stateError: "错误", stateForbidden: "无权限", stateDisabled: "已关闭"
  }
} as const;

export function isAppLocale(value: string | undefined): value is AppLocale {
  return supportedLocales.includes(value as AppLocale);
}
