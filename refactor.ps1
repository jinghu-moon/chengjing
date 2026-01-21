# ========================================================
#   Lime-Tab 最终重构脚本 (自动提权版)
#   功能：自动获取管理员权限，严格执行方案 A 重构
# ========================================================

# 1. 自动提权检测模块
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "正在请求管理员权限..." -ForegroundColor Yellow
    $newProcess = New-Object System.Diagnostics.ProcessStartInfo "PowerShell"
    $newProcess.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    $newProcess.Verb = "runas"
    [System.Diagnostics.Process]::Start($newProcess)
    Exit
}

$ErrorActionPreference = "Stop"
# 确保路径获取正确（管理员模式下使用脚本所在路径）
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath
$projectRoot = $scriptPath
$srcDir = "$projectRoot\src"
$componentsDir = "$srcDir\components"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Lime-Tab 深度重构脚本 (方案 A)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "!!! 请确认已停止 npm run dev !!!" -ForegroundColor Red -BackgroundColor Yellow
Write-Host ""

# ---------------------------------------------------------
# 0. 解决 TimePicker 命名冲突 (最优先)
# ---------------------------------------------------------
Write-Host "[0/10] 解决 TimePicker 命名冲突..." -ForegroundColor Yellow
$innerTimePicker = "$componentsDir\CustomDatePicker\components\TimePicker.vue"
if (Test-Path $innerTimePicker) {
    Rename-Item $innerTimePicker "TimePanel.vue"
    Write-Host "  ✓ CustomDatePicker/components/TimePicker.vue -> TimePanel.vue" -ForegroundColor Green
}

# ---------------------------------------------------------
# 1. DatePicker 组件
# ---------------------------------------------------------
Write-Host "[1/10] 处理 DatePicker..." -ForegroundColor Yellow
if (Test-Path "$componentsDir\CustomDatePicker") {
    # 移动样式
    if (Test-Path "$componentsDir\CustomDatePicker\styles\transitions.css") {
        Move-Item "$componentsDir\CustomDatePicker\styles\transitions.css" "$componentsDir\CustomDatePicker\styles.css"
        Remove-Item "$componentsDir\CustomDatePicker\styles" -Force
        Write-Host "  ✓ styles/transitions.css -> styles.css" -ForegroundColor Gray
    }
    # 重命名文件夹
    Rename-Item "$componentsDir\CustomDatePicker" "DatePicker"
    Write-Host "  ✓ CustomDatePicker -> DatePicker" -ForegroundColor Green
}

# ---------------------------------------------------------
# 2. Select 组件
# ---------------------------------------------------------
Write-Host "[2/10] 处理 Select..." -ForegroundColor Yellow
# 先重命名文件夹
if (Test-Path "$componentsDir\CustomSelect") {
    Rename-Item "$componentsDir\CustomSelect" "Select"
    Write-Host "  ✓ CustomSelect/ -> Select/" -ForegroundColor Green
}

$selectDir = "$componentsDir\Select"
if (Test-Path $selectDir) {
    # 建立 components 和 composables 子目录
    $selectComps = "$selectDir\components"
    $selectComposables = "$selectDir\composables"
    if (-not (Test-Path $selectComps)) { New-Item -ItemType Directory -Path $selectComps | Out-Null }
    if (-not (Test-Path $selectComposables)) { New-Item -ItemType Directory -Path $selectComposables | Out-Null }

    # 移动 CustomSelect.vue -> Select/index.vue
    if (Test-Path "$componentsDir\CustomSelect.vue") {
        Move-Item "$componentsDir\CustomSelect.vue" "$selectDir\index.vue"
        Write-Host "  ✓ CustomSelect.vue -> Select/index.vue" -ForegroundColor Green
    }

    # 移动子组件到 Select/components
    $vueFiles = @("ContextMenu.vue", "SelectDropdown.vue", "SelectTrigger.vue", "SubmenuPanel.vue")
    foreach ($file in $vueFiles) {
        if (Test-Path "$selectDir\$file") {
            Move-Item "$selectDir\$file" "$selectComps\$file"
            Write-Host "  ✓ 归档子组件: $file" -ForegroundColor Gray
        }
    }
    
    # 移动 composables (use*.ts) 到 Select/composables
    $tsFiles = @("useKeyboardNav.ts", "usePosition.ts", "useSafeTriangle.ts", "useSubmenuPosition.ts")
    foreach ($file in $tsFiles) {
        if (Test-Path "$selectDir\$file") {
            Move-Item "$selectDir\$file" "$selectComposables\$file"
            Write-Host "  ✓ 归档 composable: $file" -ForegroundColor Gray
        }
    }
    Write-Host "  ✓ Select 内部结构整理完毕" -ForegroundColor Green
}

# ---------------------------------------------------------
# 3. Tooltip 组件
# ---------------------------------------------------------
Write-Host "[3/10] 处理 Tooltip..." -ForegroundColor Yellow
if (Test-Path "$componentsDir\CustomTooltip") {
    Rename-Item "$componentsDir\CustomTooltip" "Tooltip"
    Write-Host "  ✓ CustomTooltip/ -> Tooltip/" -ForegroundColor Green
}

$tooltipDir = "$componentsDir\Tooltip"
if (Test-Path $tooltipDir) {
    # 重命名入口文件
    if (Test-Path "$tooltipDir\CustomTooltip.vue") {
        Rename-Item "$tooltipDir\CustomTooltip.vue" "index.vue"
        Write-Host "  ✓ CustomTooltip.vue -> index.vue" -ForegroundColor Green
    }
    
    # 建立 composables 子目录并移动
    $tooltipComposables = "$tooltipDir\composables"
    if (-not (Test-Path $tooltipComposables)) { New-Item -ItemType Directory -Path $tooltipComposables | Out-Null }
    
    $tsFiles = @("useTooltipPosition.ts", "useTooltipSingleton.ts")
    foreach ($file in $tsFiles) {
        if (Test-Path "$tooltipDir\$file") {
            Move-Item "$tooltipDir\$file" "$tooltipComposables\$file"
            Write-Host "  ✓ 归档 composable: $file" -ForegroundColor Gray
        }
    }
}

# ---------------------------------------------------------
# 4. CalendarPanel 组件
# ---------------------------------------------------------
Write-Host "[4/10] 处理 CalendarPanel..." -ForegroundColor Yellow
if (Test-Path "$componentsDir\CalendarPanel\CalendarPanel.vue") {
    Rename-Item "$componentsDir\CalendarPanel\CalendarPanel.vue" "index.vue"
    Write-Host "  ✓ CalendarPanel/CalendarPanel.vue -> index.vue" -ForegroundColor Green
}

# ---------------------------------------------------------
# 5. TimePicker 组件
# ---------------------------------------------------------
Write-Host "[5/10] 处理 TimePicker..." -ForegroundColor Yellow
if (Test-Path "$componentsDir\TimePicker\TimePicker.vue") {
    Rename-Item "$componentsDir\TimePicker\TimePicker.vue" "index.vue"
    Write-Host "  ✓ TimePicker/TimePicker.vue -> index.vue" -ForegroundColor Green
}

# ---------------------------------------------------------
# 6. SettingsPanel 组件
# ---------------------------------------------------------
Write-Host "[6/10] 处理 SettingsPanel..." -ForegroundColor Yellow
$settingDir = "$componentsDir\SettingsPanel"
if (-not (Test-Path $settingDir)) { New-Item -ItemType Directory -Path $settingDir | Out-Null }

# 移动 SettingsPanel.vue -> index.vue
if (Test-Path "$componentsDir\SettingsPanel.vue") {
    Move-Item "$componentsDir\SettingsPanel.vue" "$settingDir\index.vue"
    Write-Host "  ✓ SettingsPanel.vue -> SettingsPanel/index.vue" -ForegroundColor Green
}

# 建立 components 子目录
$settingComps = "$settingDir\components"
if (-not (Test-Path $settingComps)) { New-Item -ItemType Directory -Path $settingComps | Out-Null }

# 移动子组件
$settingFiles = @("LayoutSelector.vue", "LayoutSettingsModal.vue", "SettingSlider.vue", "SettingSwitch.vue")
foreach ($file in $settingFiles) {
    if (Test-Path "$settingDir\$file") {
        Move-Item "$settingDir\$file" "$settingComps\$file"
        Write-Host "  ✓ 归档子组件: $file" -ForegroundColor Gray
    }
}

# 移动样式
if (Test-Path "$srcDir\style\SettingsPanel.css") {
    Move-Item "$srcDir\style\SettingsPanel.css" "$settingDir\styles.css"
    Write-Host "  ✓ style/SettingsPanel.css -> SettingsPanel/styles.css" -ForegroundColor Green
}

# ---------------------------------------------------------
# 7. NotePad 组件
# ---------------------------------------------------------
Write-Host "[7/10] 处理 NotePad..." -ForegroundColor Yellow
$notepadDir = "$componentsDir\NotePad"

if (Test-Path "$notepadDir\NotePad.vue") {
    Rename-Item "$notepadDir\NotePad.vue" "index.vue"
    Write-Host "  ✓ NotePad.vue -> index.vue" -ForegroundColor Green
}

# 建立 components 子目录（如果不存在）
$notepadComps = "$notepadDir\components"
if (-not (Test-Path $notepadComps)) { New-Item -ItemType Directory -Path $notepadComps | Out-Null }

# 移动平铺的 .vue 子组件到 components/（保留 BubbleMenu 子目录）
$notepadVueFiles = @("MiniNotePad.vue", "NoteBubbleMenu.vue", "NotePadEditor.vue", "NotePadSidebar.vue", "NotePadTrigger.vue", "TipTapEditor.vue")
foreach ($file in $notepadVueFiles) {
    if (Test-Path "$notepadDir\$file") {
        Move-Item "$notepadDir\$file" "$notepadComps\$file"
        Write-Host "  ✓ 归档子组件: $file" -ForegroundColor Gray
    }
}

# 移动 BubbleMenu 到 components/ 下（如果还在根目录）
if (Test-Path "$notepadDir\BubbleMenu") {
    Move-Item "$notepadDir\BubbleMenu" "$notepadComps\BubbleMenu"
    Write-Host "  ✓ BubbleMenu/ -> components/BubbleMenu/" -ForegroundColor Gray
}

# 建立 composables 子目录并移动
$notepadComposables = "$notepadDir\composables"
if (-not (Test-Path $notepadComposables)) { New-Item -ItemType Directory -Path $notepadComposables | Out-Null }

if (Test-Path "$notepadComps\BubbleMenu\useBubbleMenuPosition.ts") {
    Move-Item "$notepadComps\BubbleMenu\useBubbleMenuPosition.ts" "$notepadComposables\useBubbleMenuPosition.ts"
    Write-Host "  ✓ useBubbleMenuPosition 移入 composables/" -ForegroundColor Gray
}

# 重命名样式
if (Test-Path "$notepadDir\NotePad.css") {
    Rename-Item "$notepadDir\NotePad.css" "styles.css"
    Write-Host "  ✓ NotePad.css -> styles.css" -ForegroundColor Green
}

# ---------------------------------------------------------
# 8. 全局样式目录
# ---------------------------------------------------------
Write-Host "[8/10] 整理全局样式..." -ForegroundColor Yellow
if ((Test-Path "$srcDir\style") -and (-not (Test-Path "$srcDir\styles"))) {
    Rename-Item "$srcDir\style" "styles"
    Write-Host "  ✓ src/style -> src/styles" -ForegroundColor Green
}
if (Test-Path "$srcDir\style.css") {
    Move-Item "$srcDir\style.css" "$srcDir\styles\index.css"
    Write-Host "  ✓ src/style.css -> src/styles/index.css" -ForegroundColor Green
}

# ---------------------------------------------------------
# 9. 类型文件
# ---------------------------------------------------------
Write-Host "[9/10] 整理类型文件..." -ForegroundColor Yellow
if (Test-Path "$srcDir\types.ts") {
    if (-not (Test-Path "$srcDir\types")) { New-Item -ItemType Directory -Path "$srcDir\types" | Out-Null }
    Move-Item "$srcDir\types.ts" "$srcDir\types\index.ts"
    Write-Host "  ✓ types.ts -> types/index.ts" -ForegroundColor Green
}

# ---------------------------------------------------------
# 10. 清理空目录
# ---------------------------------------------------------
Write-Host "[10/10] 清理空目录..." -ForegroundColor Yellow
if (Test-Path "$componentsDir\SchedulePanel") {
    $children = Get-ChildItem "$componentsDir\SchedulePanel" -Force
    if ($children.Count -eq 0) {
        Remove-Item "$componentsDir\SchedulePanel" -Force
        Write-Host "  ✓ 删除空目录: SchedulePanel/" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎉 文件结构重构完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "接下来需要手动修复导入路径，主要涉及：" -ForegroundColor Yellow
Write-Host "  1. src/main.ts - 样式导入路径" -ForegroundColor White
Write-Host "  2. src/App.vue - 组件导入路径" -ForegroundColor White
Write-Host "  3. 各组件内部的相对路径引用" -ForegroundColor White
Write-Host ""
Write-Host "运行 'npm run dev' 根据报错逐个修复。" -ForegroundColor Cyan
Write-Host ""
Write-Host "窗口将在 15 秒后自动关闭..." -ForegroundColor Gray
Start-Sleep -Seconds 15
