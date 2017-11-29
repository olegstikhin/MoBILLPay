import React from 'react';
import { StyleSheet, Text, TextInput, Button, View, AsyncStorage } from 'react-native';


export default class App extends React.Component {
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
          placeholder={this.state.billId}
          maxLength={8}
          onChangeText={(idText) => this.setState({idText})}
        />
        <Button title="Fortsätt" onPress={() => this.saveId() } />
        <Text>Tjänsten erbjuds av Urds maskinister v.k.</Text>
      </View>
    );
  }

  async saveId(text) {
    try {
      await AsyncStorage.setItem('@MoBILLPay:billId', this.state.idText);
    } catch (error) {
      // Error saving data
    }
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
    backgroundColor: '#fff',
    margin: 20,
  },
});
