import * as React from 'react';
import Tree from 'react-d3-tree';
import {getTreeJsonData, isSupportSVG} from "./utils/util";

class ReactD3Tree extends React.Component {
    constructor(props: any) {
        super(props);
    }

    public componentDidMount() {
        if (!isSupportSVG()) {
            console.log("浏览器不支持svg,请升级!");
            return;
        }
    }

    public render() {
        //    console.log(this.getRoot());
        return (
            <div id="treeWrapper" style={{width: "960px", height: "600px"}}>
                <Tree translate={{x: 50, y: 300}} data={getTreeJsonData()} separation={{siblings: 0.3, nonSiblings: 0.5}}/>
            </div>
        );
    }
}

export default ReactD3Tree;
