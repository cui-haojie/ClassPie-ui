<script setup>
import { RouterView } from 'vue-router'
import ToastHost from '@/components/ToastHost.vue'
</script>

<template>
  <RouterView/>
  <ToastHost/>
</template>

<style>
html, body {
  padding: 0;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  background-color: rgb(248, 249, 250);
}

#app {
  width: 100%;
  min-height: 100vh;
  outline: none !important;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;

}
</style>
