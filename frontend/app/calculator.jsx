import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Keyboard } from "react-native";
import { globalStyles, colors } from "../components/styles";
import Card from "../components/Card";
import AppButton from "../components/AppButton";
import StyledTextInput from "../components/StyledTextInput";

// Fulfills the "Input / Form Screen" requirement
export default function PaintCalculatorScreen() {
  // Hooks: useState for inputs and results
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
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
    if (!length || !width || !height) {
      setErrorMessage("All fields are required."); // Show error message
      return;
    }

    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) {
      setErrorMessage("Please enter valid, positive numbers."); // Show error message
      return;
    }

    // --- Calculation Logic ---
    const wallArea = 2 * (l * h) + 2 * (w * h);
    const paintCoveragePerGallon = 325; // Standard coverage

    const gallonsNeeded = Math.ceil(wallArea / paintCoveragePerGallon);
    const primerNeeded = Math.ceil(wallArea / 215); // Primer coverage

    // Update state to display results
    setResults([
      { id: "1", name: "Gallons of Paint", qty: `${gallonsNeeded} gal` },
      { id: "2", name: "Gallons of Primer", qty: `${primerNeeded} gal` },
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
        <StyledTextInput
          placeholder="Room Height (ft)"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
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

      {/* Display results using FlatList */}
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
