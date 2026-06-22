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
      <div style="width: 840px"></div>
      <div class="right">
        <button class="manage">归档管理</button>
        <input class='search' type="text" placeholder="搜索我学的课程">
        <i class="iconfont icon-sousuo_sousuo" style="position: absolute;top:191px;right: 220px"></i>
      </div>
    </div>
    <div class="bottom">
      <div>
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
  border: 1px solid rgb(218, 220, 224);
  width: 1500px;
  border-radius: 10px;
  z-index: 1;

  padding: 18px;
  margin: 100px auto auto;
}

.join {
  position: relative;
  right: -1216px;
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
  width: 1500px;
  margin: auto;
  flex-direction: column;
  display: flex;
}

.mid {
  display: flex;
  width: 1500px;
  height: 100px;
  padding: 8px 0 12px 0;
}

.mine {
  display: flex;
  width: 220px;
  height: 70px;
}

.right {
  width: 440px;
  height: 100px;
  line-height: 100px;
}

.manage {
  background-color: #FFFFFF;
  margin-left: 12px;
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
  margin-left: 32px;
  border: 1px solid rgb(218, 220, 224);
  border-radius: 23px;
  position: relative;
  top: -3px;
  padding: 4px 30px 0 15px;
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

.icon-sousuo_sousuo {
  cursor: pointer;
}

.bottom {
  display: flex;
  background-color: rgb(248, 249, 250);
  width: 1500px;
  border: 1px solid rgb(218, 220, 224);
  padding: 12px;
  margin-bottom: 24px;
  margin-top: 12px;
  border-radius: 7px;
}

.bt_left {
  font-size: 22px;
}

.bt_right {
  position: absolute;
  left: 1640px;
  top: 310px;
  font-size: 20px;
  color: rgb(72, 138, 248);
  cursor: pointer;
}
</style>