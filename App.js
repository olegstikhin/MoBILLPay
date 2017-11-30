import React from 'react';
import { StyleSheet, Text, TextInput, Button, View, AsyncStorage } from 'react-native';
import { StackNavigator, } from 'react-navigation';

var parseString = require('xml2js').parseString;

export class HomeScreen extends React.Component {
  static navigationOptions = { title: 'MoBILLPay', };

  constructor(props){
    super(props);
    this.state = {
      billId: '',
    }
  }

  componentDidMount = () => AsyncStorage.getItem('@MoBILLPay:billId').then((value) => this.setState({'billId': value}))

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.mainheader}>Välkommen till MoBILLPay!</Text>
        <Text>Genom att använda den här applikationen kan du överföra pengar mellan kopieringskonton.</Text>
        <Text>Börja med att skriva in din fullständiga BILL-kod (8 siffror):</Text>
        <TextInput
          style={{height: 40, borderWidth: 1, padding: 5, borderColor: 'navy'}}
          keyboardType="numeric"
          secureTextEntry={true}
          maxLength={8}
          onChangeText={(idText) => this.setState({idText})}
        />
        <Button title="Fortsätt" onPress={() => this.saveId(this.state.idText) } />
      </View>
    );
  }

  async saveId(text) {
    const { navigate } = this.props.navigation;
    try {
      //await AsyncStorage.setItem('@MoBILLPay:billId', this.state.idText);
      fetch("https://bill.teknolog.fi/config", {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
        body: "code="+this.state.idText
      })
      .then((response) => response.text())
      .then((responseText) => {
        parseString(responseText, {strict: false}, function(err, result) {
          navigate('Pay', {
            billId: text,
            userName: result.HTML.BODY[0].TABLE[0].TR[5].TD[1],
            balance: result.HTML.BODY[0].TABLE[0].TR[7].TD[1].FONT[0]._,
          });
        });
      })
    } catch (error) {
      console.error(error);
    }
  }

}

export class PayScreen extends React.Component {
  static navigationOptions = { title: 'Överför', };
  render() {
    const { state } = this.props.navigation;
    return (
      <View style={styles.container}>
        <Text style={styles.mainheader}>Överför</Text>
        <Text>Hej {state.params.userName}! Du har {state.params.balance} på ditt BILL-konto.</Text>
        <Text>Till vem?</Text>
        <TextInput
          style={{height: 40, borderWidth: 1, padding: 5, borderColor: 'navy'}}
          keyboardType="numeric"
          maxLength={8}
          onChangeText={(receiverIdText) => this.setState({receiverIdText})}
        />
        <Text>Hur mycket pengar?</Text>
        <TextInput
          style={{height: 40, borderWidth: 1, padding: 5, borderColor: 'navy'}}
          keyboardType="numeric"
          maxLength={8}
          onChangeText={(amountText) => this.setState({amountText})}
        />
        <Button title="Betala" onPress={() => this.preparePayment(state.params.billId, this.state.receiverIdText, this.state.amountText.split(',').join('.')) } />
      </View>
    );
  }

  preparePayment(billId, receiverId, amount) {
    const { navigate } = this.props.navigation;
    fetch("https://bill.teknolog.fi/config", {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
      body: "code="+billId+"&account="+receiverId+"&amount="+amount
    })
    .then((response) => response.text())
    .then((responseText) => {
      parseString(responseText, {strict: false}, function(err, result) {
        navigate('Confirm', {
          billId: billId,
          receiverId: result.HTML.BODY[0].BR[0].P[0].FORM[0].INPUT[0].INPUT[0].INPUT[0].$.VALUE,
          receiverName: result.HTML.BODY[0].I[0],
          amount: amount,
          userName: result.HTML.BODY[0].TABLE[0].TR[5].TD[1],
          balance: result.HTML.BODY[0].BR[0].P[0].FORM[0].INPUT[0].INPUT[0].INPUT[0].INPUT[0].INPUT[0].$.VALUE,
        });
      });
    })
    .catch((error) => {
      console.error(error);
    });
  }
}

export class ConfirmScreen extends React.Component {
  static navigationOptions = { title: 'Sammanfattning', };
  render() {
    const { state } = this.props.navigation;
    return (
      <View style={styles.container}>
        <Text style={styles.mainheader}>Obekräftad betalning</Text>
        <Text>Mottagare: {state.params.receiverName} ({state.params.receiverId})</Text>
        <Text>Belopp: {state.params.amount} €</Text>

        <Button title="Bekräfta betalningen" onPress={() => this.pay(state.params.billId, state.params.receiverId, state.params.receiverName, state.params.amount, state.params.balance) } />
      </View>
    );
  }

  pay(billId, receiverId, receiverName, amount, balance) {
    const { navigate } = this.props.navigation;
    fetch("https://bill.teknolog.fi/config", {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
      body: "code="+billId+"&account="+receiverId+"&amount="+amount+"&balance="+balance+"&check=1337&secret=1337"
    })
    .then((response) => response.text())
    .then((responseText) => {
      parseString(responseText, {strict: false}, function(err, result) {
        if (result.HTML.BODY[0].FONT[0]._.indexOf("rdes.")) {
          navigate('Receipt', {
            billId: billId,
            receiverId: receiverId,
            receiverName: receiverName,
            amount: amount,
          });
        } else alert("Ett fel inträffade!")
      });
    })
    .catch((error) => {
      console.error(error);
    });
  }
}

export class ReceiptScreen extends React.Component {
  static navigationOptions = { title: 'Kvitto', };
  render() {
    const { state } = this.props.navigation;
    return (
      <View style={styles.container}>
        <Text style={styles.mainheader}>Kvitto</Text>
        <Text>Mottagare: {state.params.receiverName} ({state.params.receiverId})</Text>
        <Text>Belopp: {state.params.amount} €</Text>
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
    color: 'navy',
    fontWeight: 'bold',
    fontSize: 30,
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
