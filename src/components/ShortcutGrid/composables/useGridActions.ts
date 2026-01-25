import { type Ref, ref } from 'vue'
import { useDialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast/composables/useToast'
import EditForm from '../components/EditForm.vue'
import ContextMenu from '@/components/SelectMenu/components/ContextMenu.vue'
import { IconTrash, IconEdit } from '@tabler/icons-vue'
import type { Shortcut } from '@/types'
import type { OptionItem } from '@/components/SelectMenu/types'

export function useGridActions(
  shortcuts: Ref<Shortcut[]>,
  saveData: () => void,
  reflowShortcuts: () => void
) {
  const dialog = useDialog()

  const openAddModal = async () => {
    // 初始化空对象
    const editingItem: Shortcut = {
      id: 0,
      type: 'app',
      name: '',
      url: '',
      iconBase64: '',
      filled: false,
      inverted: false,
    }
    
    let savedData: Shortcut | null = null

    await dialog.open({
      title: '添加应用',
      component: EditForm,
      componentProps: {
        isFolderMode: false,
        editingItem,
        onSave: (data: Shortcut) => { savedData = data },
      },
      width: 420,
      zIndex: 10001,
      showCancelBtn: true,
      onOk: async () => {
        if (savedData) {
            const name = savedData.name.trim()
            let url = savedData.url?.trim() || ''
            if (!name || !url) return
            if (!url.startsWith('http')) url = 'https://' + url

            const newItem: Shortcut = { 
                ...savedData, 
                id: Date.now(),
                type: 'app',
                name,
                url,
                color: savedData.color,
            }
            shortcuts.value.push(newItem)
            saveData()
            reflowShortcuts()
        }
      },
    })
  }

  const openEditModal = async (item: Shortcut) => {
    const isFolderMode = item.type === 'folder'
    const editingItem = JSON.parse(JSON.stringify(item))
    let savedData: Shortcut | null = null

    await dialog.open({
      title: isFolderMode ? '编辑文件夹' : '编辑应用',
      component: EditForm,
      componentProps: {
        isFolderMode,
        editingItem,
        onSave: (data: Shortcut) => {
          savedData = data
        },
      },
      width: 420,
      zIndex: 10001,
      showCancelBtn: true,
      onOk: async () => {
        if (savedData) {
          if (isFolderMode) {
            const target = shortcuts.value.find(i => i.id === item.id)
            if (target) {
              target.name = savedData.name
              target.folderMode = savedData.folderMode
            }
            saveData()
            return
          }

          const name = savedData.name.trim()
          let url = savedData.url?.trim() || ''
          if (!name || !url) return
          if (!url.startsWith('http')) url = 'https://' + url

          const itemData: Shortcut = {
            ...savedData,
            id: item.id,
            type: 'app',
            name,
            url,
            color: savedData.color,
          }

          const idx = shortcuts.value.findIndex(i => i.id === item.id)
          if (idx > -1) {
            shortcuts.value[idx] = itemData
          } else {
            // 如果顶层没找到，可能是在文件夹内
            for (const s of shortcuts.value) {
              if (s.type === 'folder' && s.children) {
                const childIdx = s.children.findIndex(c => c.id === item.id)
                if (childIdx > -1) {
                  s.children[childIdx] = itemData
                  break
                }
              }
            }
          }

          saveData()
          reflowShortcuts()
        }
      },
    })
  }

  // 引入 Toast
  const toast = useToast()

  // 删除逻辑：返回恢复函数
  const deleteItem = (item: Shortcut) => {
    // 1. 尝试在顶层查找
    const topIndex = shortcuts.value.findIndex(i => i.id === item.id)
    if (topIndex > -1) {
      const deleted = shortcuts.value[topIndex]
      shortcuts.value.splice(topIndex, 1)
      saveData()
      reflowShortcuts()
      
      // 返回恢复函数
      return () => {
        shortcuts.value.splice(topIndex, 0, deleted)
        saveData()
        reflowShortcuts()
      }
    }

    // 2. 尝试在文件夹内查找
    for (const folder of shortcuts.value) {
      if (folder.type === 'folder' && folder.children) {
        const childIndex = folder.children.findIndex(c => c.id === item.id)
        if (childIndex > -1) {
          const deleted = folder.children[childIndex]
          folder.children.splice(childIndex, 1)
          saveData()
          reflowShortcuts()
          
          // 返回恢复函数
          return () => {
             // 需要重新查找文件夹（防止文件夹也被移动或修改）
             // 但这里假设文件夹 ID 不变
             const currentFolder = shortcuts.value.find(f => f.id === folder.id)
             if (currentFolder && currentFolder.children) {
                 currentFolder.children.splice(childIndex, 0, deleted)
                 saveData()
                 reflowShortcuts()
             }
          }
        }
      }
    }
    return () => {} // 未找到，返回空操作
  }

  // 右键菜单引用，需要在组件中绑定 ref
  const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

  const showContextMenu = async (e: MouseEvent, item: Shortcut) => {
    const menuOptions: OptionItem[] = [
      { value: 'edit', label: '编辑/重命名', prefixIcon: IconEdit },
      { value: 'delete', label: '删除', danger: true, prefixIcon: IconTrash },
    ]

    const result = await contextMenuRef.value?.open(e, menuOptions)

    if (result === 'edit') {
      openEditModal(item)
    } else if (result === 'delete') {
      dialog.open({
        title: '确认删除',
        content: `确定要删除 "${item.name}" 吗？此操作可以撤销。`,
        type: 'warning',
        showCancelBtn: true,
        confirmOnEnter: true,
        onOk: () => {
           const restore = deleteItem(item)
           
           toast.success('已删除', {
               duration: 3000,
               action: {
                   label: '撤销',
                   onClick: () => {
                       restore()
                       toast.success('已恢复')
                   }
               }
           })
        }
      })
    }
  }

  return {
    openAddModal,
    openEditModal,
    deleteItem,
    showContextMenu,
    contextMenuRef
  }
}
