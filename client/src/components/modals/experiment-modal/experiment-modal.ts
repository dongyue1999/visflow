import { Vue, Component, Watch } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import BaseModal from '../base-modal/base-modal';
import { ExperimentInfo, EXPERIMENT_STEPS } from '@/store/experiment/types';

@Component({
  components: {
    BaseModal,
  },
})
export default class ExperimentModal extends Vue {
  @ns.modals.State('experimentModalVisible') private experimentModalVisible!: boolean;
  @ns.modals.Mutation('openExperimentModal') private openExperimentModal!: () => void;
  @ns.modals.Mutation('closeExperimentModal') private closeExperimentModal!: () => void;
  @ns.experiment.Action('answer') private experimentAnswer!: (payload: { question: string, answer: string }) => void;
  @ns.experiment.Mutation('next') private experimentNextStep!: () => void;
  @ns.experiment.Mutation('previous') private experimentPreviousStep!: () => void;
  @ns.experiment.State('filename') private experimentFilename!: string;
  @ns.experiment.State('step') private experimentStep!: string;
  @ns.experiment.Action('cancel') private cancelExperiment!: () => void;
  @ns.experiment.Action('start') private startExperiment!: () => Promise<ExperimentInfo>;

  private titles = {
    consentForm: 'VisFlow User Study: Consent Form for IRB-FY2018-2102',
    overview: 'User Study Overview',
    visflowTutorial: 'VisFlow Tutorial',
    clear1: 'Clear Diagram',
    flowsenseTutorial: 'FlowSense Tutorial',
    practice: 'System Practice',
    clear2: 'Clear Diagram',
    task: 'Experiment Tasks',
    task1: 'Task 1',
    task2: 'Task 2',
    task3: 'Task 3',
    survey: 'Feedback Survey',
    end: 'End of Study',
    finish: 'Study Completed',
  };

  private task1Answer = '';
  private task2Answer = '';
  private task3Answer = '';
  private surveyLinkClicked = false;

  get sessionLink(): string {
    return window.location.protocol + '//' + window.location.host +
      ((window.location.pathname.match(/.*\//) || [])[0]) + this.experimentFilename;
  }

  get surveyLink(): string {
    return 'https://docs.google.com/forms/d/e/1FAIpQLSd7axi-vj-7bt_SUwpZObU5G3sI0HQUOARd4LFZc6DxWeDqzg/' +
      `viewform?usp=pp_url&entry.1022855007=${this.experimentFilename}`;
  }

  get stepIndex(): number {
    return EXPERIMENT_STEPS.indexOf(this.experimentStep);
  }

  get currentStep(): string {
    return this.stepIndex === -1 ? 'finish' : EXPERIMENT_STEPS[this.stepIndex];
  }

  get isNextDisabled() {
    return this.experimentStep === 'survey' && !this.surveyLinkClicked;
  }

  private next() {
    if (this.currentStep.match(/^task\d/)) {
      let answer = '';
      if (this.currentStep === 'task1') {
        answer = this.task1Answer;
      } else if (this.currentStep === 'task2') {
        answer = this.task2Answer;
      } else if (this.currentStep === 'task3') {
        answer = this.task3Answer;
      }
      this.experimentAnswer({
        question: this.currentStep,
        answer,
      });
    }
    this.experimentNextStep();
  }

  private previous() {
    this.experimentPreviousStep();
  }

  private close() {
    this.cancelExperiment();
    (this.$refs.modal as BaseModal).close();
  }

  @Watch('experimentModalVisible')
  private onVisibleChange() {
    if (!this.experimentModalVisible) {
      this.close();
    }
  }

  @Watch('experimentStep')
  private onStepChange() {
  }
}
