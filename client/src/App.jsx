import React, { Component } from 'react';
import logo from './logo.svg';
import write from './write.svg';
import './App.css';


class Livedoc extends Component {
  constructor(props) {
    super(props);
    /* PROPS = {
      author,
      date,
      isOpen,
      } */
    console.log("running livedoc constructor and assigning a new id to it");
    //TODO: Create the ID elsewhere, when the new doc icon is clicked
    const UUID = Math.round(new Date().getTime()/1000).toString() + this.props.author;
    console.log(UUID);
    this.state = {
      doc_id: UUID,
      title: 'Title',
      content: 'Writing...'
    };

    //Function Declarations
    this.updateContent = this.updateContent.bind(this);
    this.updateTitle = this.updateTitle.bind(this);
    //Fetch Functions
    this.getDoc = this.getDoc.bind(this);
    this.postDoc = this.postDoc.bind(this);
    this.putDoc = this.putDoc.bind(this);
  }

  //bool isShared... then do the fetches on a timer, every half second (a-la the perceptual loop of humans)
  //call a function on a timer in componentDidMount that checks if the doc is shared, and if so,
  //pulls every 0.5 seconds. kind of inefficient but whatever.

  //so then you should also remove the fetches from componentDidUpdate

  componentDidMount() {
    if(!this.props.isFresh) {
      this.getDoc()
        .then(res => this.setState({title: res.title, content: res.content}))
        .catch(err => console.log(err));
    }
  }
  getDoc = async () => {
    const response = await fetch('/api/livedoc/' + this.props.author + '/' + this.state.title);
    const body = await response.json();
    if (response.status != 200) throw Error(body.message);

    return body;
  };
  //push livedoc state on update and return the fresh content from server
  //this gets called every time you enter something to log in. bad bad bad bad bad.
  componentDidUpdate() {
    const docData = {
      doc_id: this.state.doc_id,
      doctitle: this.state.title,
      doccontent: this.state.content,
      author: this.props.author,
      datetime: this.props.date,
      isOpen: this.props.isOpen
    };
      //update old doc in DB
      //change it back to res.msg after
      this.putDoc(docData)
      .then(res => console.log(res.msg))
      .catch(err => console.log(err));
  }
  //unused function atm
  postDoc = async(data) => {
    const response = await fetch('/api/livedoc', {
      body: JSON.stringify(data),
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'user-agent': this.props.author,
        'content-type': 'application/json',
      },
      method: 'POST'
    });
    const body = await response.json();
    if (response.status != 200) throw Error(body.message);
    return body;  //should just be the livedoc again
  };
  putDoc = async(data) => {
    const response = await fetch('/api/livedoc/' + this.props.author + '/newdoc', {
      body: JSON.stringify(data),
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'user-agent': this.props.author,
        'content-type': 'application/json',
      },
      method: 'PUT'
    });
    const body = await response.json();
    if (response.status != 200) throw Error(body.message);
    return body;  //shoul
  }
  //still need to set the contentString to be this editable textarea, somehow.
  //Should update state, then call componentDidUpdate when it finishes, which will post to the server.
  //do a get every second if there are two people in the doc.
  updateContent(event) { this.setState({ content: event.target.value}); }
  updateTitle(event) {this.setState({ title: event.target.value}); }
  render() {
    return (
      <div className="doc-editor">
        <div className="doc-title-input">
            <input type="text" id="doc-name" name="doc_name" onChange={this.updateTitle} value={this.state.title} onFocus={function(e){e.target.select();}}/>
        </div>
        <div className="doc-textarea">
            <textarea id="doc-content" name="doc_content" onChange={this.updateContent} value={this.state.content} onFocus={function(e){e.target.select();}}/>
        </div>
      </div>
    )
  }
}
//need to figure out how to pass the login data back to the parent class with props/"lifting state up"
class LoginBar extends Component {
  constructor(props) {
    super(props);
    this.handleLogin = this.handleLogin.bind(this);
    this.updateUserStr = this.updateUserStr.bind(this);
    this.updatePwdStr = this.updatePwdStr.bind(this);
    this.updateLogin = this.updateLogin.bind(this);
    this.logout = this.logout.bind(this);
  }
  //succeeded is true following authentication
  //false otherwise
  updateLogin(isAuthentic) { this.props.onLogin(isAuthentic); }

  handleLogin(event) {
    event.preventDefault(); //hype
    const loginData = {
      'username': this.props.username,
      'password': this.props.password
    }
    this.postLogin(loginData)
      .then(res => this.updateLogin(res.authenticated))
      .catch(err => console.log(err));
    //so before, I apssed
  }
  postLogin = async(data) => {
    const response = await fetch('/api/login', {
      body: JSON.stringify(data),
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      method: 'POST'
    });
    const body = await response.json();
    if (response.status != 200) throw Error(body.message);
    console.log(body.authenticated);
    console.log(body.msg);
    return body;
  };

  updateUserStr(event) { this.props.onUserStrChange(event.target.value); }
  updatePwdStr(event) { this.props.onPwdStrChange(event.target.value); }
  logout() {this.props.handleLogout();}

  render() {
    if(!this.props.isLoggedIn) {
      return (
        <div className="login-component">
          <form id="loginform" onSubmit={this.handleLogin} action='api/login' method='POST'>
            <div>
              <input type="text" id="login-username" name="login_username" value={this.props.username} onChange={this.updateUserStr} onFocus={function(e){e.target.select();}}/>
            </div>
            <div>
              <input type="password" id="login-password" name="login_password" value={this.props.password} onChange={this.updatePwdStr} onFocus={function(e){e.target.select();}}/>
            </div>
          </form>
          <div>
              <button type="submit" className="login-btn" form="loginform">Login</button>
          </div>
        </div>
      );
    } else {
      return (
        <div className = "logout-component">
          <div className="logged-in-message">
            <p>Welcome, {this.props.username} </p>
          </div>
          <div>
            <button id="logout-btn" onClick={this.logout}>Logout</button>
          </div>
        </div>
      )
    }
  }
}
//stub
class PostPane extends Component {
  constructor(props) {
    /* PROPS = {
      author,
      isOpen?
    } */
    super(props);
    this.state = {
      titles: [],
      contents: [],
    };
    //Functions
    //Fetch Functions
  }
  //need to get the postID's by fetching posts with the user when you mount the component.
  componentDidMount() {

  }

  componentDidUpdate() {

  }

  render() {
    var titles = this.state.titles;
    var titleList = titles.map((title) => 
      <li key={postID}>{title}</li>
    );
    return (
      <div className="my-post-list">
        <ul>
          {titleList}
        </ul>
      </div>
    )
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      user: 'Pseudonym',
      password: 'Password',
      isLoggedIn: false,
      isDocOpen: false,
      tutor: false
    };
    //LoginBar Update Functions
    this.updateUserStr = this.updateUserStr.bind(this);
    this.updatePwdStr = this.updatePwdStr.bind(this);
    this.updateLogin = this.updateLogin.bind(this);
    //Component Render Functions
    this.renderLiveDoc = this.renderLiveDoc.bind(this);
    this.renderLoginBar = this.renderLoginBar.bind(this);
    this.logout = this.logout.bind(this);
    this.openDoc = this.openDoc.bind(this);
  }
  
  componentDidMount() {
    //this.callApi()
      //.then(res => this.setState({ response: res.express }))
      //.catch(err => console.log(err));
  }
  renderLiveDoc(isNew) {
    //var user = 'testUser';
    if(this.state.isLoggedIn) {
      var today = new Date();
      var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
      //isFresh should be dynamic for when this is rendered via a new doc button!
      return (
        <Livedoc author={this.state.user} date={date} isOpen={this.state.isDocOpen} isFresh={isNew}/>
      );
    }
    else return;
  }
  renderLoginBar() {
    return (
      <LoginBar username={this.state.user} password={this.state.password} isLoggedIn={this.state.isLoggedIn} handleLogout={this.logout} onLogin={this.updateLogin} onUserStrChange={this.updateUserStr} onPwdStrChange={this.updatePwdStr}/>
    );
  }
  //LoginBar Update Functions
  updateUserStr(username) {this.setState({user: username});}
  updatePwdStr(password) {this.setState({password: password});}
  updateLogin(isAuthentic) {this.setState({isLoggedIn: isAuthentic});}
  logout() {
    this.setState(prevState => ({
      isLoggedIn: !prevState.isLoggedIn
    }));
  }
  //stub, possibly expand once newdoc icon is in.
  openDoc() {
    this.setState(prevState => ({
      isDocOpen: !prevState.isDocOpen
    }));
  }
  //<img src={write} className="new-doc-button" onClick={}/>
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={write} className="App-logo" alt="logo" />
          <h1 className="App-title">English Works</h1>
          {this.renderLoginBar()}
        </header>
        <div className="App-intro">
          {this.renderLiveDoc(true)}
        </div>
      </div>
    );
  }
}
export default App;