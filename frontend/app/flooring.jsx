import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Keyboard } from "react-native";
import { globalStyles, colors } from "../components/styles";
import Card from "../components/Card";
import AppButton from "../components/AppButton";
import StyledTextInput from "../components/StyledTextInput";

// Fulfills the "Input / Form Screen" requirement
export default function FlooringCalculatorScreen() {
  // Hooks: useState for inputs and results
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [results, setResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState(""); // For validation
  const [successMessage, setSuccessMessage] = useState(""); // For success

  // Event handler for the submit button
  const handleCalculate = () => {
    Keyboard.dismiss();
    setErrorMessage("");
    setSuccessMessage("");
    setResults([]);

    // Requirement: Validate fields (non-empty, numeric)
    if (!length || !width) {
      setErrorMessage("All fields are required."); // Show error message
      return;
    }

    const l = parseFloat(length);
    const w = parseFloat(width);

    if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) {
      setErrorMessage("Please enter valid, positive numbers."); // Show error message
      return;
    }

    // --- Calculation Logic ---
    const totalArea = l * w;
    const wasteFactor = 1.1; // 10% waste
    const materialNeeded = Math.ceil(totalArea * wasteFactor);

    const flooringBox = 20.1;
    const boxesNeeded = Math.ceil(materialNeeded / flooringBox);

    setResults([
      { id: "1", name: "Flooring Material", qty: `${materialNeeded} sq. ft.` },
      { id: "2", name: "Flooring Boxes", qty: `${boxesNeeded} boxes` },
    ]);

    setSuccessMessage("Calculation successful!"); // Show success message
  };

  return (
    <View style={globalStyles.container}>
      <Card>
        <Text style={globalStyles.headerDarkText}>Room Dimensions (ft)</Text>

        {/* Requirement: Form using TextInput  */}
        <StyledTextInput
          placeholder="Room Length (ft)"
          keyboardType="numeric"
          value={length}
          onChangeText={setLength} // Event handling
        />
        <StyledTextInput
          placeholder="Room Width (ft)"
          keyboardType="numeric"
          value={width}
          onChangeText={setWidth}
        />

        {/* Requirement: Show success or error messages  */}
        {errorMessage ? (
          <Text style={globalStyles.errorText}>{errorMessage}</Text>
        ) : null}
        {successMessage ? (
          <Text style={globalStyles.successText}>{successMessage}</Text>
        ) : null}

        {/* Requirement: Button to submit  */}
        <AppButton title="Calculate Materials" onPress={handleCalculate} />
      </Card>

      {/* Display results using FlatList, as per proposal  */}
      {results.length > 0 && (
        <Card>
          <Text style={globalStyles.headerText}>Materials Needed</Text>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.resultItem}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultQty}>{item.qty}</Text>
              </View>
            )}
          />
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultName: {
    fontSize: 16,
    color: colors.text,
  },
  resultQty: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
});
