<template>
<base-modal ref="modal" title="Dataset"
  :visible-state="visible"
  :on-open="open"
  :on-close="close"
  >
  <template slot="content">
    <div class="list">
    <h5>数据库类型
      <select name="database" id="database-select">
      <option value="">--请选择--</option>
      <option value="mongodb">mongodb</option>
      <option value="mysql">mysql</option>
      </select>
      </h5></br>
      <h5>URI<input type="text" id="name" name="name" required
       minlength="4" maxlength="8" size="10"></h5>
       <b-btn variant="outline-secondary" @click="connect">连接</b-btn>
      <h5>我的数据集</h5>
      <dataset-list ref="datasetList" :selectable="selectable"
        @selectDataset="onDatasetListSelect"
        @deselectDataset="onDatasetListDeselect"
      ></dataset-list>
    </div>
  </template>
  <template slot="footer">
    <div v-if="selectable">
      <b-btn variant="outline-secondary" @click="close">取消</b-btn>
      <b-btn variant="outline-success" @click="selectDataset" :disabled="!datasetSelected">确认</b-btn>
    </div>
  </template>
</base-modal>
</template>

<style scoped lang="scss" src="./connect-database-modal.scss"></style>

<script lang="ts" src="./connect-database-modal.ts">
</script>
