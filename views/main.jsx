'use babel';

import React from 'react';
let iconColor = {color:'#675BC0'}
import {ipcRenderer, remote} from 'electron'
const main = remote.require('./main.js')
const Config = require('../config.json')
const formatCurrency = require('format-currency')
import { Circle } from 'better-react-spinkit'
import Select from 'react-select'

export default class Main extends React.Component {

  constructor() {
    super();
    this.state = {
      version:null,
      data:[],
      updateAvailable:false,
      loading:true,
      page:'home',
      fromOptions: Config.tickers.map(x=>{return {label:x.label,value:x.value}}),
      toOptions: Config.currencies.map(x=>{return {label:x.label,value:x.value}}),
      currentSettings: {}

    };
    this.handleBox = this.handleBox.bind(this);
    this.handleAppUpdate = this.handleAppUpdate.bind(this);
    this.handlePrefUpdate = this.handlePrefUpdate.bind(this);
    this.handlePageUpdate = this.handlePageUpdate.bind(this);
    this.handleRefreshPref = this.handleRefreshPref.bind(this);
  }

  handleBox(from, to, price, exchange, prefix){
    ipcRenderer.send('async', {selected:[from,to,price,exchange,prefix]});
  }

  handleAppUpdate(){
    main.restart();
  }

  handlePrefUpdate(e,i,option){
    let newSettings = main.store.get('preferences')
    newSettings.currencies[i][option] = e.label
    main.store.set('preferences', newSettings)
    this.setState({currentSettings:main.store.get('preferences')})    
  }

  handleRefreshPref(){
    main.disconnect()
    main.connect()
    this.setState({page:'home'})
  }

  handlePageUpdate(page){
    this.setState({page:page})
  }

  componentWillMount(){
    this.setState({currentSettings:main.store.get('preferences')})
    let prices;
    // Websocket data
    ipcRenderer.on('socket' , function(event , data) {
      console.log(data)
      prices = Object.keys(data).map(key => {
        return {priceData:data[key], direction: data[key].flag ==='1' ? 'up' : 'down'}
        })
      this.setState({data:prices})
      if(prices.length == 1){
        this.setState({loading:false})
      }
      }.bind(this));
    
      ipcRenderer.on('update' , function(event , result) {
     
      if (result.updateAvailable){
        this.setState({updateAvailable:true})
      }

    }.bind(this))

    this.setState({version:main.app.getVersion()})

  }

  render() {

    // if(this.state.loading){
    //   return (
    //     <div className="myarrow">
    //       <div className="page darwin">
    //         <div className="container">
    //           <br/>
    //           <center><Circle size={50} color="#675BC0"/>
    //             <h2>Fetching data from servers</h2></center>
    //   </div></div></div>
    //   )
    // }

    let Footer = (<div className="footer">
    <h2><a target="_blank" href="https://github.com/geraldoramos/crypto-bar">Crypto Bar</a> <span className="version">1.0.18</span>
    { this.state.updateAvailable ?
    <span>&nbsp;(<a href="#" onClick={this.handleUpdate}>Update available</a>)</span> : null}
    </h2>
    </div>)

    let preDirection = 0
    let priceDirection = (dir) => {
      if(dir==="1"){
        preDirection = dir
        return <i className="fas fa-caret-up up"/>
      } else if(dir==="2"){
        preDirection = dir
        return <i className="fas fa-caret-down down"/>
      } else if (preDirection < dir){
        preDirection = dir
        return <i className="fas fa-caret-up up"/>
      }else{
        preDirection = dir
        return <i className="fas fa-caret-down down"/>
      }
    }


    if(this.state.page === 'home'){
      
      let currencyList = this.state.data.map (x =>{
          return (
            <div className="box" href="#" onClick={() => this.handleBox(x.priceData.from,x.priceData.to,x.priceData.price,x.priceData.exchange,x.priceData.prefix)}>
            <div className="currency">{x.priceData.from} <span className="exchange">({x.priceData.exchange})</span> </div>
            <div className="price">{x.priceData.prefix}{formatCurrency(x.priceData.price)}&nbsp;{priceDirection(x.priceData.flag)}</div>
            <div className="volume">V:{formatCurrency(x.priceData.volume24h)}</div>
          </div>)
      })
    
      const n = 6 - this.state.data.length

      let loadBox = [...Array(n)].map((e, i) => {
        return (
        <div className="box"><br/>
        <center><Circle size={20} color="#675BC0"/>
        <h2>Waiting...</h2></center></div>)
    })

  
    return (
    <div className="myarrow">
      <div className="page darwin">
        <div className="container">
          <div className="header">
          <div className="title"><h1><span className="main-title"><i style={iconColor} className="fas fa-signal"/> Monitored Coins</span>
          <div className="settings" onClick={() => this.handlePageUpdate('settings')}><i style={iconColor} className="fas fa-cog"/></div></h1></div>
          </div>
        <div className="inside">
          <div className="row">
              {currencyList}
              {loadBox}
            </div>
            </div>
            {Footer} 
        </div>
      </div>
      </div>
    )
  }

  if(this.state.page === 'settings'){

    let SubOptions = this.state.currentSettings.currencies.map((x,i) => {
    return  (<div className="submenuRow">
    <Select
    name="fromOptions"
    className={i > 2 ? 'open-top' : null}
    style={{width:'65px',margin:'2px'}}
    clearable={false}
    scrollMenuIntoView={false}
    value={{label:x.from,value:x.from}}
    onChange={(e) => this.handlePrefUpdate(e,i,'from')}
    options={this.state.fromOptions}
  />
    <Select
    name="toOptions"
    className={i > 2 ? 'open-top' : null}
    style={{width:'65px',margin:'2px'}}
    clearable={false}
    scrollMenuIntoView={false}
    value={{label:x.to,value:x.to}}
    onChange={(e) => this.handlePrefUpdate(e,i,'to')}
    options={this.state.toOptions}
  />
  <Select
    name="exchange"
    className={i > 2 ? 'open-top' : null}
    style={{width:'90px',margin:'2px'}}
    clearable={false}
    scrollMenuIntoView={false}
    value={{label:x.exchange,value:x.exchange}}
    onChange={(e) => this.handlePrefUpdate(e,i,'exchange')}
    options={Config.tickers.filter(y=>x.from==y.label).map(y=>y.exchange)[0].map(y=>{return {value:y,label:y}})}
  />
  </div>)

    })
      
  return (
  <div className="myarrow">
    <div className="page darwin">
      <div className="container">
        <div className="header">
        <div className="title"><h1><span className="main-title"><i style={iconColor} className="fas fa-cog"/> Settings</span>
        <div className="settings" onClick={() => this.handlePageUpdate('home')}><i style={iconColor} className="fas fa-signal"/></div></h1></div>
        </div>
      <div className="inside">
      <div className="submenu-subtitle">Select the currencies to monitor (From, To, Exchange)</div>
      {SubOptions}
      <center><h2><a onClick={this.handleRefreshPref}><i className="fas fa-sync-alt"/>&nbsp; Update</a></h2></center>
          </div>
        {Footer}
      </div>
    </div>
    </div>
  )
}

}

}