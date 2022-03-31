<template>
  <div
    class="main-use-class"
    style="padding: 23px; right: 12; border-color: #0a70f5; top: 0; left: 0"
  >
    <template>
      <div class="demo_box">3123123</div>
    </template>
    <div class="demo_box">
      <div class="demo-box2">2222</div>
    </div>
    <div class="demo-box2">box2</div>
    <div class="sub_demo_box">sub_box</div>
  </div>
</template>
<style lang="less" scoped>
.main-use-class {
  width: 100%;
  font-size: 12px;
  height: 100%;
  margin-top: 8px;
  margin-bottom: 12px;
  display: flex;
  color: #0a70f5;
  border: 1px solid #0a70f5;
  position: absolute;
  top: 0;
  left: 0;
  .demo_box {
    width: 100%;
    margin: 8px;
    border: 1px solid #0a70f5;
    background-color: #f5f5f5;
    padding: 0px 20px 0px 20px;
    .sub_demo_box {
      color: red;
    }
  }
  .demo_box2 {
    width: 100%;
    margin: 8px;
    border: 1px solid #0a70f5;
    background-color: #f5f5f5;
    padding: 0px 20px 0px 20px;
  }
}

.demo-test {
  font-size: 14px;
}
</style>
