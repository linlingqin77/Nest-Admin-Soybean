/**
 * 缓存的 key 枚举
 */
export enum CacheEnum {
  /** 登录用户 redis key */
  LOGIN_TOKEN_KEY = 'login_tokens:',

  /** 验证码 redis key */
  CAPTCHA_CODE_KEY = 'captcha_codes:',

  /** 参数管理 cache key */
  SYS_CONFIG_KEY = 'sys_config:',

  /** 字典管理 cache key */
  SYS_DICT_KEY = 'sys_dict:',

  /** 防重提交 redis key */
  REPEAT_SUBMIT_KEY = 'repeat_submit:',

  /** 限流 redis key */
  RATE_LIMIT_KEY = 'rate_limit:',

  /** 登录账户密码错误次数 redis key */
  PWD_ERR_CNT_KEY = 'pwd_err_cnt:',

  /** 公众号类型 */
  GZ_TYPE = 'gz_type:',

  /** 微信code存储 */
  MA_CODE = 'ma_code:',

  /** 用户缓存 */
  SYS_USER_KEY = 'user:',

  /** 部门缓存 */
  SYS_DEPT_KEY = 'sys_dept:',

  /** 菜单缓存 */
  SYS_MENU_KEY = 'sys_menu:',

  /** Token 黑名单 redis key (需求 4.8) */
  TOKEN_BLACKLIST_KEY = 'token_blacklist:',

  /** 用户 Token 版本 redis key (需求 4.9) */
  USER_TOKEN_VERSION_KEY = 'user_token_version:',
}
