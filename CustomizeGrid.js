import React, { Component } from 'react';
import {
  Col,
  Row,
  TabContent, TabPane, Nav, NavItem, NavLink,
  Collapse, CardBody, Form, FormGroup, Label, Button, Input
} from 'reactstrap';

import Columns from 'react-columns';
import { Link } from 'react-router-dom'
import ReactTable from 'react-table';

import 'react-table/react-table.css';
import { myConfig } from '../config.js';

class CustomizeGrid extends Component {

  constructor(props) {
    super(props);
    //
    this.toggle = this.toggle.bind(this);
    this.showHide = this.showHide.bind(this);
    this.setOrder = this.setOrder.bind(this);
    this.state = {
        today: new Date().toISOString().slice(0, 10),
        activeTab: new Array(4).fill('1'),
        collapse: true,
        rows_camps: [],     // Camps Data
        columns_camps: [],  // Camps Columns
        rows_adsets: [],    // Adsets Data
        columns_adsets: [], // Camps Columns
        rows_ads: [],       // Ads Data
        columns_ads: [],    // Ads Columns
        showMap: [],        // Show/Hide Status Map for all Columns
        orderMap: [],       // Column Order Map for all Columns
    };
    //
    this.campsTable = React.createRef();    // Camps Grid Reference
    this.adsetsTable = React.createRef();   // Adsets Grid Reference
    this.adsTable = React.createRef();      // Ads Grid Reference
  }

  // Set Column Order API Call
  setOrder(e,type,field,order){
      order = e.target.value;
      let orderMap = this.state.orderMap;
      orderMap[type][field] = order;
      this.setState({
          orderMap:orderMap
      });
      fetch(myConfig.apiUrl + "/set_order?type="+type+"&field="+field+"&order="+order)
      .then(res => res.json())
      .then((data) => {})
      .catch(console.log)
  }

  // Set Column Show/Hide Status API Call
  showHide(type,field,row){
      let showMap = this.state.showMap;
      showMap[type][field] = showMap[type][field]==1 ? 0 : 1;
      this.setState({
          showMap:showMap
      });
      fetch(myConfig.apiUrl + "/save_columns?type="+type+"&field="+field+"&visible="+showMap[type][field])
      .then(res => res.json())
      .then((data) => {})
      .catch(console.log)
  }

  // Set Columns headers state
  defineColumns(row,type){
      var columns_ = [];
      var col_i = 0;
      columns_[col_i++] = {Header: "",id: "row", maxWidth: 50, filterable: false,
                                  Cell: (row) => {return <div>{row.index + 1}</div>;}};
      columns_[col_i++] = {Header: "ID", accessor: "id", show: false};
      columns_[col_i++] = {Header: "Field", accessor: "field", filterMethod: this.filterText};
      columns_[col_i++] = {Header: "Order", accessor: "order", filterMethod: this.filterText,
                                Cell: (row) => (
                                    <div style={{
                                          width: '100%',
                                          height: '100%',
                                          textAlign: 'center'
                                        }}
                                      >
                                        <Input type="text" value={this.state.orderMap[type][row.row.field]}
                                            onChange={(e) => this.setOrder(e,type,row.row.field,row.row.order)}/>
                                      </div>
                                )
                            };
      columns_[col_i++] = {Header: "Visible", accessor: "visible", filterMethod: this.filterText,
                                Cell: (row) => (
                                    <div style={{
                                          width: '100%',
                                          height: '100%',
                                          textAlign: 'center'
                                        }}
                                      >
                                        <Button color={this.state.showMap[type][row.row.field]==1 ? 'primary':'danger'}
                                            onClick={() => this.showHide(type,row.row.field,row)}>
                                            {this.state.showMap[type][row.row.field]==1 ? 'ON':'OFF'}
                                        </Button>
                                      </div>
                                )
                            };
      return columns_;
  }

  // Returns Columns Visibility/Order Map
  getColumnMap(type,data_){
      let showMap = [];
      showMap["visible"] = [];
      showMap["order"] = [];
      for (var i in data_){
          showMap["visible"][data_[i]["field"]] = data_[i]["visible"];
          showMap["order"][data_[i]["field"]] = data_[i]["order"];
      }
      return showMap;
  }

  // Main Fetch Columns Metadata API Call
  fetchColumns(){
      fetch(myConfig.apiUrl + "/columns")
      .then(res => res.json())
      .then((data) => {
            var map = [];
            var showMap = [];
            var orderMap = [];
            // Camps
            var rows_camps = data["camps_col"];
            var columns_camps = this.defineColumns(rows_camps[0],1);
            map = this.getColumnMap(1,rows_camps);
            showMap[1] = map["visible"];
            orderMap[1] = map["order"];
            // Adsets
            var rows_adsets = data["adsets_col"];
            var columns_adsets = this.defineColumns(rows_adsets[0],2);
            map = this.getColumnMap(2,rows_adsets);
            showMap[2] = map["visible"];
            orderMap[2] = map["order"];
            // Ads
            var rows_ads = data["ads_col"];
            var columns_ads = this.defineColumns(rows_ads[0],3);
            map = this.getColumnMap(3,rows_ads);
            showMap[3] = map["visible"];
            orderMap[3] = map["order"];
            //
            this.setState({
                showMap: showMap,
                orderMap: orderMap,
                rows_camps: rows_camps,
                rows_adsets: rows_adsets,
                rows_ads: rows_ads,
                columns_camps: columns_camps,
                columns_adsets: columns_adsets,
                columns_ads: columns_ads
            })
      })
      .catch(console.log)
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  // Toggle Active Tab
  toggle(tabPane, tab) {
    const newArray = this.state.activeTab.slice()
    newArray[tabPane] = tab
    this.setState({
      activeTab: newArray,
    });
  }

  // Customized Filter Number Function
  filterNum(filter, row) {
    if(!filter)
        return false;
    if (filter.value.indexOf(",") > -1){
        var vals = filter.value.split(",");
        if(vals.length == 2){
            if(vals[0]=="")
                return (row[filter.id] <= vals[1]);
            else if(vals[1]=="")
                return (row[filter.id] >= vals[0]);
            return (row[filter.id] >= vals[0] && row[filter.id] <= vals[1]);
        }
    }
    return (row[filter.id] == filter.value);
  }

  // Customized Filter text Function
  filterText(filter, row) {
    if(!filter)
        return false;
    return (row[filter.id].toLowerCase().indexOf(filter.value.toLowerCase()) > -1);
  }

  // TODO: Split into separate component
  // Tabs Component
  tabPane() {
    const { rows_camps, columns_camps,
            rows_adsets, columns_adsets,
            rows_ads, columns_ads} = this.state;
    //
    return (
      <>
        <TabPane tabId="1">
          <Row>
            <Col xs="12" sm="12" lg="12">
              <ReactTable
                data={rows_camps}
                ref={this.campsTable}
                columns={columns_camps}
                defaultPageSize={50}
                onFilteredChange={this.handleFilterChange}
                minRows={2}
                filterable
              />
            </Col>
          </Row>
        </TabPane>
        <TabPane tabId="2">
          <Row>
            <Col xs="12" sm="12" lg="12">
              <ReactTable
                data={rows_adsets}
                ref={this.adsetsTable}
                columns={columns_adsets}
                defaultPageSize={50}
                onFilteredChange={this.handleFilterChange}
                minRows={2}
              />
            </Col>
          </Row>
        </TabPane>
        <TabPane tabId="3">
          <Row>
            <Col xs="12" sm="12" lg="12">
              <ReactTable
                data={rows_ads}
                ref={this.adsTable}
                columns={columns_ads}
                defaultPageSize={50}
                onFilteredChange={this.handleFilterChange}
                minRows={2}
              />
            </Col>
          </Row>
        </TabPane>
      </>
    );
  }

  // Main Render Function
  render() {
    return (
          <div className="animated fadeIn">
            <Nav tabs>
              <NavItem>
                <NavLink
                  active={this.state.activeTab[0] === '1'}
                  onClick={() => { this.toggle(0, '1'); }}
                >
                  Camps
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  active={this.state.activeTab[0] === '2'}
                  onClick={() => { this.toggle(0, '2'); }}
                >
                  Adsets
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  active={this.state.activeTab[0] === '3'}
                  onClick={() => { this.toggle(0, '3'); }}
                >
                  Ads
                </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={this.state.activeTab[0]}>
              {this.tabPane()}
            </TabContent>
          </div>
    );
  }

  componentDidMount() {
      // Fetch Columns Metadata
      this.fetchColumns();
  }
}

export default CustomizeGrid;
