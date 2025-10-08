import RepeatMenu from '../Menus/RepeatMenu';
import StateDecorator from './StateDecorator';

export default {
  title: 'Components/RepeatMenu',
  component: RepeatMenu,
  decorators: [StateDecorator],

  parameters: {
    layout: 'centered',
    // grid: true,
    // background: {
    //   default: 'Paper',
    // },
  },
};

// Default story
export const Default = {
  args: {},
};
