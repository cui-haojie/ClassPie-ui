import { defineStore } from 'pinia'

export const useCourseUiStore = defineStore('courseUi', {
  state: () => ({
    activeTab: 'all',
  }),
  persist: {
    pick: ['activeTab'],
  },
})