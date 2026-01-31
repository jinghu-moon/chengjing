/**
 * 备份数据校验器
 */

// 当前应用版本 (备份格式版本)
export const CURRENT_BACKUP_VERSION = 1
const APP_NAME = 'ChengJing'

export interface BackupMeta {
  version: number
  exportTime: number
  appName: string
  dataKeys: string[]
}

export interface BackupContainer {
  meta: BackupMeta
  data: Record<string, any>
}

export type ValidationResult = 
  | { status: 'valid'; version: number }
  | { status: 'migrate'; version: number } // 旧版本，需迁移
  | { status: 'reject'; reason: string }   // 校验失败

/**
 * 校验备份文件合法性
 */
export function validateBackup(json: any): ValidationResult {
  // 1. 基础结构检查
  if (!json || typeof json !== 'object') {
    return { status: 'reject', reason: '文件格式错误 (Not an object)' }
  }

  if (!json.meta || !json.data) {
    return { status: 'reject', reason: '缺少必要字段 (meta/data)' }
  }

  const meta = json.meta as BackupMeta

  // 2. AppName 检查
  if (meta.appName !== APP_NAME) {
    return { status: 'reject', reason: `应用标识不匹配 (期望 ${APP_NAME}, 实际 ${meta.appName || 'Unknown'})` }
  }

  // 3. 完整性检查 (DataKeys)
  if (Array.isArray(meta.dataKeys)) {
    const missingKeys = meta.dataKeys.filter(key => !(key in json.data))
    if (missingKeys.length > 0) {
      console.warn('[Backup] 数据字段缺失:', missingKeys)
      // V1.0 暂时允许缺失（可能是空数据），只做 warning
    }
  }

  // 4. 版本检查
  const ver = meta.version || 0

  if (ver === CURRENT_BACKUP_VERSION) {
    return { status: 'valid', version: ver }
  }

  if (ver < CURRENT_BACKUP_VERSION) {
    return { status: 'migrate', version: ver }
  }

  if (ver > CURRENT_BACKUP_VERSION) {
    return { status: 'reject', reason: `备份版本过高 (v${ver})，当前版本 (v${CURRENT_BACKUP_VERSION}) 不支持，请升级应用。` }
  }

  return { status: 'reject', reason: '未知版本错误' }
}
