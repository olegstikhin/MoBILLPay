import React from 'react';
import { StyleSheet, Text, TextInput, Button, View, AsyncStorage, Keyboard } from 'react-native';
import { StackNavigator, } from 'react-navigation';

var parseString = require('xml2js').parseString;
var iconv = require('iconv-lite');
var Buffer = require('buffer/').Buffer;

function post(url, params) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "arraybuffer";
    xhr.onreadystatechange = function() {//Call a function when the state changes.
      if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
        var b = new Buffer.from(xhr.response);
        var decodedResponse = iconv.decode(b, 'win1252');
        resolve(decodedResponse);
      }
    }
    xhr.send(params);
  });
}

export class HomeScreen extends React.Component {
  static navigationOptions = { title: 'MoBILLPay', headerLeft: null };

  constructor(props){
    super(props);
    this.state = {
      idText: '',
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.mainheader}>Välkommen till MoBILLPay!</Text>
        <Text style={styles.text}>Genom att använda den här applikationen kan du överföra pengar mellan kopieringskonton.</Text>
        <Text style={styles.h2}>Logga in </Text>
        <Text style={styles.text}>Börja med att skriva in din fullständiga BILL-kod (8 siffror):</Text>
        <TextInput
          style={styles.inputfield}
          keyboardType="numeric"
          secureTextEntry={true}
          maxLength={8}
          onChangeText={(idText) => this.setState({idText})}
        />
        <Button style={styles.mainbutton} title="Logga in" onPress={() => this.saveId(this.state.idText) } />
        <Text style={styles.text}>MoBILLPay 0.1.1 - 1 december 2017</Text>
      </View>
    );
  }

  async saveId(text) {
    const { navigate } = this.props.navigation;

    try {
      post("https://bill.teknolog.fi/config", "code=" + this.state.idText)
      .then((responseText) => {
        parseString(responseText, {strict: false}, function(err, result) {
          navigate('Pay', {
            billId: text,
            userName: result.HTML.BODY[0].TABLE[0].TR[5].TD[1],
            balance: result.HTML.BODY[0].TABLE[0].TR[7].TD[1].FONT[0]._,
          });
        });
      })
      .catch((err) => {
        alert("Inget konto hittades!");
        console.log(err);
      });
    } catch (error) {
      alert("Ett fel inträffade");
      console.log(error);
    }
  }

}

export class PayScreen extends React.Component {
  static navigationOptions = { title: 'Kontrollpanel', headerLeft: null};

  constructor(props){
    super(props);
    this.state = {
      receiverIdText: '',
      amountText: '',
    }
  }

  render() {
    const { state } = this.props.navigation;
    return (
      <View style={styles.container}>
        <Text style={styles.mainheader}>Ditt konto</Text>
        <Text style={styles.text}>Hej {state.params.userName}!</Text>
        <Text style={styles.text}>Saldo: {state.params.balance}.</Text>
        <Text style={styles.mainheader}>Ny överföring</Text>
        <TextInput
          style={styles.inputfield}
          keyboardType="numeric"
          maxLength={8}
          placeholder="Mottagare"
          placeholderTextColor="black"
          onChangeText={(receiverIdText) => this.setState({receiverIdText})}
        />
        <TextInput
          style={styles.inputfield}
          keyboardType="numeric"
          maxLength={8}
          placeholder="Transaktionsbelopp"
          placeholderTextColor="black"
          onChangeText={(amountText) => this.setState({amountText})}
        />
        <Button title="Betala" onPress={() => this.preparePayment(state.params.billId, this.state.receiverIdText, this.state.amountText.split(',').join('.')) } />
      </View>
    );
  }

  preparePayment(billId, receiverId, amount) {
    const { navigate } = this.props.navigation;

    try {
      post("https://bill.teknolog.fi/config", "code="+billId+"&account="+receiverId+"&amount="+amount)
      .then((responseText) => {
        parseString(responseText, {strict: false}, function(err, result) {
          try {
            navigate('Confirm', {
              billId: billId,
              receiverId: result.HTML.BODY[0].BR[0].P[0].FORM[0].INPUT[0].INPUT[0].INPUT[0].$.VALUE,
              receiverName: result.HTML.BODY[0].I[0],
              amount: amount,
              userRealName: result.HTML.BODY[0].TABLE[0].TR[4].TD[1],
              userName: result.HTML.BODY[0].TABLE[0].TR[5].TD[1],
              balance: result.HTML.BODY[0].BR[0].P[0].FORM[0].INPUT[0].INPUT[0].INPUT[0].INPUT[0].INPUT[0].$.VALUE,
            });
          } catch (err) { alert ("Fel inmatning!"); }
        });
      })
      .catch((error) => {
        alert ("Ett fel inträffade.");
        console.error(error);
      });
    } catch (err) { alert ("Fel inmatning!"); }
  }
}

export class ConfirmScreen extends React.Component {
  static navigationOptions = { title: 'Sammanfattning', };

  render() {
    const { state } = this.props.navigation;

    Keyboard.dismiss();

    return (
      <View style={styles.container}>
        <Text style={styles.mainheader}>Obekräftad överföring</Text>
        <View style={styles.paymentinfo}>
          <Text style={styles.paymentminor}>Överföring från</Text>
          <Text style={styles.paymentrecipient}>{state.params.userRealName}</Text>
          <Text style={styles.paymentminor}>till</Text>
          <Text style={styles.paymentrecipient}>{state.params.receiverName}</Text>
          <Text style={styles.paymentamount}>{state.params.amount} €</Text>
        </View>
        <Button style={styles.mainbutton} title="Bekräfta betalningen" onPress={() => this.pay(state.params.billId, state.params.receiverId, state.params.receiverName, state.params.userRealName, state.params.amount, state.params.balance) } />
      </View>
    );
  }

  pay(billId, receiverId, receiverName, userRealName, amount, balance) {
    const { navigate } = this.props.navigation;
    post("https://bill.teknolog.fi/config", "code="+billId+"&account="+receiverId+"&amount="+amount+"&balance="+balance+"&check=1337&secret=1337")
    .then((responseText) => {
      parseString(responseText, {strict: false}, function(err, result) {
        if (result.HTML.BODY[0].FONT[0]._.indexOf("rdes.")) {
          navigate('Receipt', {
            billId: billId,
            receiverId: receiverId,
            receiverName: receiverName,
            userRealName: userRealName,
            amount: amount,
          });
        } else alert("Ett fel inträffade!")
      });
    })
    .catch((error) => {
      alert ("Ett fel inträffade.");
      console.error(error);
    });
  }
}

export class ReceiptScreen extends React.Component {
  static navigationOptions = { title: 'Kvitto', headerLeft: null };
  render() {
    const { state, navigate } = this.props.navigation;

    return (
      <View style={styles.container}>
        <Text style={styles.mainheader}>Bekräftelse</Text>
        <View style={styles.paymentreceipt}>
          <Text style={[styles.paymentminor, styles.wtext]}>Överföring från</Text>
          <Text style={[styles.paymentrecipient, styles.wtext]}>{state.params.userRealName}</Text>
          <Text style={[styles.paymentminor, styles.wtext]}>till</Text>
          <Text style={[styles.paymentrecipient, styles.wtext]}>{state.params.receiverName}</Text>
          <Text style={[styles.paymentamount, styles.wtext]}>{state.params.amount} €</Text>
        </View>
        <Button
          onPress={() => navigate('Home', {})}
          title="Återvänd"
        />
      </View>
    );
  }
}

const Navigator = StackNavigator({
  Home: {screen: HomeScreen},
  Pay: {screen: PayScreen},
  Confirm: {screen: ConfirmScreen},
  Receipt: {screen: ReceiptScreen},
});


export default class Root extends React.Component {
  render() {
    return(
      <View style={styles.root}>
        <Navigator />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainheader: {
    fontWeight: 'bold',
    fontSize: 24,
    marginTop: 10,
  },
  h2: {
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 10,
  },
  mainbutton: {
    marginTop: 10,
    marginBottom: 10,
  },
  text: {
    marginTop: 10,
  },
  wtext: {
    color: "white",
  },
  inputfield: {
    height: 40,
    padding: 5,
  },
  paymentinfo: {
    alignSelf: 'stretch',
    flex: 1,
    marginTop: 30,
    marginBottom: 60,
    padding: 20,
    backgroundColor: "#f4aa42",
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentreceipt: {
    alignSelf: 'stretch',
    flex: 1,
    marginTop: 30,
    marginBottom: 60,
    padding: 20,
    backgroundColor: "#0a680e",
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentrecipient: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  paymentminor: {
    fontSize: 18,
  },
  paymentamount: {
    fontWeight: 'bold',
    fontSize: 48,
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    margin: 20,
  },
  root: {
    flex: 1,
    paddingTop: Expo.Constants.statusBarHeight,

  }
});
