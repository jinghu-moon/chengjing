# --- 配置 ---
$output_file = "fileTree.txt"

# 仅按“名称”排除（当前层级）
$exclude_names = @(
    ".vscode", "dist", "node_modules", "public",
    "icons", "debug", "release",
    "sv.ps1", "fileTree.txt", "tree.ps1",
    "test.svg", "gen", "workers",
    "README.md", ".gitignore", "target",".spec-workflow",".trae","script",".agent"
)

# 按“路径”排除（整棵子树）
# 使用「相对项目根目录」的写法
$exclude_paths = @(
    "src/assets"
)

# --- 脚本开始 ---

$treeLines = [System.Collections.Generic.List[string]]::new()
$root = Get-Item .
$rootPath = $root.FullName
$treeLines.Add("$($root.Name)/")

function Is-ExcludedPath {
    param([string]$FullPath)

    foreach ($relPath in $exclude_paths) {
        # 统一成 Windows 路径
        $normalized = ($rootPath + "\" + $relPath) -replace '/', '\'

        if ($FullPath.StartsWith($normalized, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }
    return $false
}

function Get-FileTree {
    param(
        [string]$Path,
        [string]$Prefix
    )

    $items = Get-ChildItem -Path $Path | Where-Object {

        # 名称排除
        if ($_.Name -in $exclude_names) { return $false }

        # 路径排除（整棵子树）
        if (Is-ExcludedPath $_.FullName) { return $false }

        # 版本目录
        if ($_.Name -match '^v\d+.*$') { return $false }

        # dll 文件
        if ($_.Extension -eq ".dll") { return $false }

        return $true
    } | Sort-Object Name

    $count = $items.Count

    for ($i = 0; $i -lt $count; $i++) {
        $item = $items[$i]
        $isLast = ($i -eq $count - 1)

        if ($isLast) {
            $line = "└──"
            $child = "    "
        }
        else {
            $line = "├──"
            $child = "│   "
        }

        if ($item.PSIsContainer) {
            $treeLines.Add("$Prefix$line $($item.Name)/")
            Get-FileTree -Path $item.FullName -Prefix "$Prefix$child"
        }
        else {
            $treeLines.Add("$Prefix$line $($item.Name)")
        }
    }
}

Get-FileTree -Path $rootPath -Prefix ""

# 输出
$treeLines | Write-Host
$treeLines | Out-File -FilePath $output_file -Encoding utf8BOM
$treeLines | Set-Clipboard

Write-Host ""
Write-Host "成功保存到 `"$output_file`""
Write-Host "已复制到剪贴板。"
Write-Host ""
Read-Host "按 Enter 键退出" | Out-Null
