<script setup lang="js" name="painting">

</script>

<template>
<div class="painting">
<img src="../assets/classPai.png" alt="商标" class="paintingImg">
  <img src="../assets/newbg.png" alt="背景" class="bgImg">
</div>
</template>

<style scoped>
.painting {
  display: flex;
  height: 100%;
  margin: 0;
  padding: 0;
  width: 100%;
  background-color: rgb(248,249,250);
}
.paintingImg {
  left: 78px;
  position: absolute;
  top: 55px;
}
.bgImg {
  left: 285px;
  position: relative;
  top: 115px;
  height: 700px;
}
</style>