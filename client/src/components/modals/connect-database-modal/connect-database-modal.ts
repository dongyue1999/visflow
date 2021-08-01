import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import mongoose from 'mongoose';
import DatasetList from '@/components/dataset-list/dataset-list';
import { DatasetInfo } from '@/store/dataset/types';
import BaseModal from '@/components/modals/base-modal/base-modal';
import {showSystemMessage} from "@/common/util";
import ns from "@/store/namespaces";
import {UserConnection} from "@/store/user/types";


@Component({
  components: {
    DatasetList,
    BaseModal,
  },
})
export default class DatasetModal extends Vue {
    @ns.user.Action('connect') private dispatchConnect!: (profile: UserConnection) => Promise<string>;
  @Prop()
  private selectable!: boolean;

  // Dataset modal manages the visible state in itself instead of the global store.
  private visible = false;

  private datasetSelected: DatasetInfo | null = null;

  private database_type='';
  private uri='';

  public open() {
    this.visible = true;
    // Refresh the list on each open call.
    (this.$refs.datasetList as DatasetList).getList();
  }
  public connect() {
    console.log('连接中···');
    // 连接上用户输入的数据库
    // 将里面的dataset读取出来
    // 断开连接 重新连接回系统数据库
    // 暴力操作！

    // 连接数据库
    const modal = this.$refs.modal as BaseModal;
    this.dispatchConnect({
      database_type: this.database_type,
      uri: this.uri,
    }).then((database_type: string) => { // dispatchConnect()成功之后执行的
      modal.close();
      showSystemMessage(this.$store, `Welcome ${database_type}`, 'success');
    }).catch(modal.errorHandler); // dispatchConnect()失败之后执行的

    // 将里面的dataset读取出来
    (this.$refs.datasetList as DatasetList).getList();
    // 怎么刷新一下？

    // 断开连接 重新连接回系统数据库
    //close();
    this.dispatchConnect({
      database_type: this.database_type,
      uri: 'mongodb://localhost:27017/visflow',
    }).then((database_type: string) => { // dispatchConnect()成功之后执行的
      modal.close();
      showSystemMessage(this.$store, `Welcome ${database_type}`, 'success');
    }).catch(modal.errorHandler); // dispatchConnect()失败之后执行的

  }

  private close() {
    this.visible = false;
    this.datasetSelected = null;
  }

  private onDatasetListSelect(dataset: DatasetInfo) {
    this.datasetSelected = dataset;
  }

  private onDatasetListDeselect() {
    this.datasetSelected = null;
  }

  private selectDataset() {
    this.$emit('selectDataset', this.datasetSelected);
    this.close();
  }

  private onFileUpload() {
    // Refresh the list of datasets.
    (this.$refs.datasetList as DatasetList).getList();
  }

  @Watch('visible')
  private onvisibleChange() {
    if (!this.visible) {
      this.close();
    }
  }
}
