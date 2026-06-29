import { defineStore } from 'pinia'

export const useCourseUiStore = defineStore('courseUi', {
  state: () => ({
    selectedSemester: 'all',
    activeTab: 'all',
  }),
  persist: {
    pick: ['activeTab'],
  },
})