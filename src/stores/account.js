import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', {
    state: () => ({
        account: null,
    }),
    actions: {
        setAccount(account) {
            this.account = account
        },
        logout() {
            this.account = null
        },
    },
    persist: true,
})