<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <body>
  <div style="margin: auto">
  <div id="app">
    <RouterView/>
  </div>
  </div>
  </body>
</template>

<style>
html,body {
  padding: 0;
  width: 100%;
  min-height: calc(76.9231vh);
  margin: auto;
  background-color: rgb(248, 249, 250);
}
#app{
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
