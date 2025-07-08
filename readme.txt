These files get added to the customizations/components/Blocks folder

To register IconLinkRow block, add to src/index.js

import graphSVG from '@plone/volto/icons/slider.svg';
import { Edit as GraphBlockEdit, View as GraphBlockView} from './components/Blocks/GraphBlock';

const applyConfig = (config) => {

	//GraphBlock
	config.blocks.blocksConfig.graphBlock = {
	    id: 'graphBlock',
	    title: 'Graph Block',
	    icon: graphSVG,
	    group: 'common',
	    view: GraphBlockView,
	    edit: GraphBlockEdit,
	    restricted: false,
	    mostUsed: true,
	    sidebarTab: 1,
	};

	return config;
};

export default applyConfig;