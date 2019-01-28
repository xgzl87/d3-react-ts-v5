import * as React from 'react';
// @ts-ignore
import {BrowserRouter as Router, Link, Route} from "react-router-dom";
import DragTree from "./dragTree";
import ReactD3Tree from "./reactD3Tree";
import {isSupportSVG} from "./utils/util";

class App extends React.Component {
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
        return (
            <Router>
                <div>
                    <ul>
                        <li>
                            <Link to="/">react-d3-tree</Link>
                        </li>
                        <li>
                            <Link to="/dragTree">可拖动添加删除</Link>
                        </li>
                    </ul>


                    <Route exact={true} path="/" component={ReactD3Tree}/>
                    <Route path="/dragTree" component={DragTree}/>
                </div>
            </Router>
        );
    }
}

export default App;
