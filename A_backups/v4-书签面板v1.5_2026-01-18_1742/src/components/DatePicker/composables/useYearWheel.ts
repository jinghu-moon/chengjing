import { ref, computed } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'

const YEAR_OFFSETS = [-3, -2, -1, 1, 2, 3]

export interface YearData {
  year: number
  isCurrent: boolean
  isSelected: boolean
}

export function useYearWheel(viewDate: { value: Dayjs }) {
  const currentYear = dayjs().year()
  const wheelCenter = ref(dayjs().year())

  // 选中的年份（来自 viewDate）
  const selectedYear = computed(() => viewDate.value.year())

  // 生成单个年份数据
  const makeYearData = (year: number): YearData => ({
    year,
    isCurrent: year === currentYear,
    isSelected: year === selectedYear.value,
  })

  // 周边年份（上3个 + 下3个）
  const displayYears = computed(() =>
    YEAR_OFFSETS.map(offset => makeYearData(wheelCenter.value + offset))
  )

  // 中心年份
  const centerYearData = computed(() => makeYearData(wheelCenter.value))

  // 调整轮盘
  const adjustWheel = (direction: 'up' | 'down') => {
    wheelCenter.value += direction === 'up' ? 1 : -1
  }

  // 处理滚轮事件
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault()
    adjustWheel(event.deltaY > 0 ? 'up' : 'down')
  }

  // 同步轮盘中心到指定年份
  const syncToYear = (year: number) => {
    wheelCenter.value = year
  }

  return {
    wheelCenter,
    displayYears,
    centerYearData,
    adjustWheel,
    handleWheel,
    syncToYear,
  }
}
