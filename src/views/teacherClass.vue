<script setup lang="js" name="teacherClass">
import {useRouter} from "vue-router";
</script>

<template>
  <div class="main">
    <div class="Top">
      <h2>置顶课程</h2>
      <button class="join">＋ 创建/加入课程</button>
      <br>
    </div>
    <div class="mid">
      <div class="mine">
        <div style="width: 86px;height: 52px;font-size:22px;padding: 0 20px 0 0;line-height: 52px">
          我学的
        </div>
        <div style="width: 110px;height: 52px;font-size:22px;padding: 0 0 0 20px;line-height: 52px">
          我协助的
        </div>
      </div>
      <div class="right">
        <button class="manage">归档管理</button>
        <div class="search-wrapper">
          <input class='search' type="text" placeholder="搜索我学的课程">
          <i class="iconfont icon-sousuo_sousuo search-icon"></i>
        </div>
      </div>
    </div>
    <div class="bottom">
      <div class="bottom-header">
        <div class="bt_left">
          2024-2025 第一学期
        </div>
        <div class="bt_right">
          展开
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.Top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgb(218, 220, 224);
  width: 100%;
  max-width: 1500px;
  border-radius: 10px;
  z-index: 1;
  padding: 18px;
  margin: 20px auto auto;
}

.join {
  border: none;
  background-color: rgb(72, 138, 248);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  height: 47px;
  width: 180px;
  font-size: 18px;
}

h2 {
  font-size: 23px;
  color: #575A5B;
  font-weight: 500;
}

.main {
  width: 100%;
  max-width: 1500px;
  margin: auto;
  flex-direction: column;
  display: flex;
  padding: 0 16px;
  box-sizing: border-box;
}

.mid {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  min-height: 100px;
  padding: 8px 0 12px 0;
  flex-wrap: wrap;
  gap: 16px;
}

.mine {
  display: flex;
  height: 70px;
}

.right {
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-wrap: wrap;
  gap: 12px;
}

.search-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  right: 12px;
  cursor: pointer;
  pointer-events: none;
}

.manage {
  background-color: #FFFFFF;
  height: 46px;
  width: 127px;
  border-radius: 5px;
  border: 1px solid rgb(218, 220, 224);
  font-size: 19px;
  color: rgb(96, 98, 102);
  cursor: pointer;
}

.manage:hover {
  background-color: rgb(236, 243, 254);
  border: 1px solid rgb(198, 218, 252);
  color: rgb(66, 133, 244);
}

.search {
  width: 267px;
  height: 46px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 23px;
  padding: 4px 36px 0 15px;
}

input::placeholder {
  color: rgb(192, 196, 207);
  font-size: 17px;
}

input:focus {
  outline: none;
  border-color: rgb(72, 138, 248);
  border-width: 1px;
}

.bottom {
  background-color: rgb(248, 249, 250);
  width: 100%;
  border: 1px solid rgb(218, 220, 224);
  padding: 12px;
  margin-bottom: 24px;
  margin-top: 12px;
  border-radius: 7px;
}

.bottom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bt_left {
  font-size: 22px;
}

.bt_right {
  font-size: 20px;
  color: rgb(72, 138, 248);
  cursor: pointer;
}
</style>
