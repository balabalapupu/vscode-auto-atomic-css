<template>
  <div class="demo-body">
    <div class="demo-div">
      <span class="demo-span">test-span1</span>
      <span>test-span2</span>
    </div>
  </div>
</template>
<style lang="less" scoped>
.demo-box {
  width: 100%;
}
.demo-body {
  .demo-div {
    width: 100%;
    font-size: 14px;
    display: flex;
    background-color: yellow;
    .demo-span {
      font-size: 12px;
      margin-left: 8px;
    }
  }
}
.demo-test {
  width: 100%;
}
</style>
