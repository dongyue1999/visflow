<template>
<base-modal ref="modal" title="数据库"
  :visible-state="visible"
  :on-open="open"
  :on-close="close"
  >
  <!--
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
  </template>-->
    <template slot="content">
    <b-container fluid>
      <b-row>
        <b-col sm="3" class="input-label">数据库类型</b-col>
        <b-col sm="9"><b-form-input type="text" v-model="database_type"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="3" class="input-label">URI</b-col>
        <b-col sm="9"><b-form-input type="text" v-model="uri"></b-form-input></b-col>
      </b-row>
     <b-row>
     <b-btn class="float-right" variant="outline-success" @click="connect">连接</b-btn>
     <b-btn class="float-right" variant="outline-secondary" @click="$refs.modal.close()">取消</b-btn>
    </b-row>
      <b-row><h5>我的数据集</h5></b-row>
      <dataset-list ref="datasetList" :selectable="selectable"
        @selectDataset="onDatasetListSelect"
        @deselectDataset="onDatasetListDeselect"
      ></dataset-list>
    </b-container>

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
