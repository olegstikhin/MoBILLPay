import React from 'react';
import { StyleSheet, Text, TextInput, Button, View, AsyncStorage } from 'react-native';
import { StackNavigator, } from 'react-navigation';


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
    const { navigate } = this.props.navigation;

    return (
      <View style={styles.container}>
        <Text style={styles.mainheader}>Välkommen till MoBILLPay!</Text>
        <Text>Genom att använda den här applikationen kan du överföra pengar mellan kopieringskonton.</Text>
        <Text>Börja med att skriva in din fullständiga BILL-kod (8 siffror):</Text>
        <TextInput
          style={{height: 40, borderWidth: 1, padding: 5, borderColor: 'navy'}}
          keyboardType="numeric"
          placeholder={this.state.billId}
          maxLength={8}
          onChangeText={(idText) => this.setState({idText})}
        />
        <Button title="Spara och fortsätt" onPress={() => navigate('Pay', {billId: this.state.idText}) } />
      </View>
    );
  }

  async saveId(text) {
    try {
      await AsyncStorage.setItem('@MoBILLPay:billId', this.state.idText);
    } catch (error) {
      // Error saving data
    }
    navigate('PayScreen');
  }

}

export class PayScreen extends React.Component {
  static navigationOptions = { title: 'Överför', };
  render() {
    const { state } = this.props.navigation;
    return (
      <View style={styles.container}>
        <Text style={styles.mainheader}>Överför</Text>
        <Text>Din BILL-kod: {state.params.billId}</Text>
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
          onChangeText={(receiverIdText) => this.setState({receiverIdText})}
        />
        <Button title="Betala" onPress={() => this.pay(state.params.billId, state.receiverIdText, state.amount) } />
      </View>
    );
  }

  pay(billId, receiverId, amount) {
    var paramString = "code="+billId+"&amount="+amount+"&account="+receiverId;
    fetch("http://bill.teknolog.fi/config", {
      method: 'POST',
      headers: new Headers({
                 'Content-Type': 'application/x-www-form-urlencoded',
        }),
      body: paramString
    })
    .then((response) => response.text())
    .then((responseText) => {
      var findText1 = responseText.indexOf("balance") + 16;
      var findText2 = responseText.indexOf("'>Kontrollkod");
      var amountString = "";
      for (i = findText1; i < findText2; i++) {
        amountString += responseText[i];
        alert(amountString);
      }

    })
    .catch((error) => {
      console.error(error);
    });

  }
}

const Navigator = StackNavigator({
  Home: {screen: HomeScreen},
  Pay: {screen: PayScreen},
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
