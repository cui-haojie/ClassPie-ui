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
  flex-direction: column;
  align-items: flex-start;
  flex: 1.2;
  max-width: 760px;
  min-width: 0;
}

.paintingImg {
  margin-bottom: 28px;
  max-width: 100%;
  height: auto;
  max-height: 72px;
}

.bgImg {
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: min(680px, 78vh);
  object-fit: contain;
}
</style>
