<script setup lang="js" name="mainClass">
import {RouterView, RouterLink, useRoute, useRouter} from "vue-router";
import {storeToRefs} from "pinia";
import {useAccountStore} from "@/stores/account.js";

const accountStore = useAccountStore();
const {account} = storeToRefs(accountStore);
console.log(account.value)
const router = useRouter();

function userSetting() {
  head.style.display = head.style.display === 'block' ? 'none' : 'block';
}


</script>

<template>
  <body style="background-color:#FFFFFF;height:100%;">
  <div class="leader">
    <img src="../assets/newClassPi.png" id="Pi">
    <div style="width: 60px"></div>
    <div class="word" style="width: 85px">我的课堂</div>
    <div style="width: 900px"></div>
    <div class="leader_container">
      <div class="content" style="width: 80px">AI工具集</div>
      <div class="content"><i class="iconfont icon-chazhong"></i>论文查重</div>
      <div class="content"><i class="iconfont icon-renwubiao"></i>任务管理</div>
      <div class="content" style="width: 30px;"><i class="iconfont icon-lingdang-xianxing"></i></div>
      <div style="position: relative;top:15px;right:0;cursor: pointer">
        <img src="@/assets/head.png" style="width: 47px;border-radius: 50%" @click="userSetting"></div>
    </div>
    <div id="head" style="width: 130px;margin-top: 12px;padding: 12px;display: none;
    position: absolute;right: 15px;top: 55px;box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);background-color: #FFFFFF ">
      <ul style="font-size: 14px;color: rgb(108, 110, 113)">
        <li>开通VIP</li>
        <li>账号容量</li>
        <li>机构用户认证</li>
        <li @click="router.push('/userSetting')">个人设置</li>
        <li>退出登陆</li>
      </ul>
    </div>
  </div>
  <RouterView/>
  </body>
</template>

<style scoped>

#Pi {
  height: 37px;
  width: 147px;
}

.leader {
  display: flex;
  width: 100%;
  height: 83px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  align-items: center;
  position: fixed;
  z-index: 10;
  background-color: white;
  top: 0;
  left: 0;
  right: 0;
  padding: 0 calc(30px + 15px) 0 30px;
}

.word {
  font-size: 20px;
  font-family: Roboto, Helvetica, Arial, sans-serif;
  height: 83px;
  color: rgb(72, 138, 248);
  border-bottom: 2px solid rgb(72, 138, 248);
  line-height: 83px;
  cursor: pointer;
}

.leader_container {
  font-family: Roboto, Helvetica, Arial, sans-serif;
  height: 83px;
  font-size: 20px;
  line-height: 83px;
  display: flex;
}

.content {
  margin-right: 15px;
  cursor: pointer;
  width: 100px;
}

.content:hover {
  color: rgb(72, 138, 248);
}

h2 {
  font-size: 23px;
  color: #575A5B;
  font-weight: 500;
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

li {
  list-style-type: none;
  padding: 0 20px 0 12px;
  margin: 0 -12px;
  width: 128px;
  height: 30px;
  cursor: pointer;
  line-height: 30px;
}

li:hover {
  background-color: rgb(232, 240, 255);
}

</style>