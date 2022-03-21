<template>
  <div class="demo-box">
    <div class="demo-div">
      <span class="demo-span">test-span1</span>
      <span>test-span2</span>
    </div>
  </div>
</template>
<style lang="less" scoped>
.demo-div {
  width: 100%;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: yellow;
  .demo-span {
    font-size: 12px;
    margin-left: 8px;
    display: block;
    background-color: blue;
  }
}
</style>
