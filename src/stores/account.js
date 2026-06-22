import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', {
    state: () => ({
        account: null,
    }),
    actions: {
        setAccount(account) {
            this.account = account
        },
    },
    persist: true,
})