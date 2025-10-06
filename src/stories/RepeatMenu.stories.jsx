import RepeatMenu from '../Menus/RepeatMenu';
import StateDecorator from './StateDecorator';

export default {
  title: 'Components/RepeatMenu',
  component: RepeatMenu,
  decorators: [StateDecorator],

  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

// Default story
export const Default = {
  args: {},
};
