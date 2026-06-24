import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', {
    state: () => ({
        account: null,
        avatarUrl: null,
        name: null,
    }),
    actions: {
        setAccount(account, profile = {}) {
            this.account = account
            if (profile.avatar_url !== undefined) {
                this.avatarUrl = profile.avatar_url || null
            }
            if (profile.name !== undefined) {
                this.name = profile.name || null
            }
        },
        setAvatarUrl(url) {
            this.avatarUrl = url || null
        },
        setName(name) {
            this.name = name || null
        },
        logout() {
            this.$reset()
        },
    },
    persist: true,
})
