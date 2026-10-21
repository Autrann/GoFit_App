import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import catalog from "../assets/data/catalogo_app.json";
import { imageMap } from "../assets/imgs/imageMap";

import { ListRenderItem } from "react-native";
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { lightColors, darkColors } from '../theme/colors';

type Exercise = {
  id: string;
  name: string;
  muscle: string;
  image: string;
};

export default function CatalogScreen() {
const { isDark, toggleTheme } = useContext(ThemeContext);
const colors = isDark ? darkColors : lightColors;
const styles = getStyles(colors);
  // Func para cada tarjeta de ejercicio
  const renderItem: ListRenderItem<Exercise> = ({ item }) => {
    const imageSource = imageMap[item.id as keyof typeof imageMap];

    return (
      <View style={styles.card}>      
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.image, { justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ fontSize: 10, color: "#999", textAlign: "center" }}>Sin imagen</Text>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.muscle}>{item.muscle}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Catálogo de Ejercicios</Text>
      <FlatList
        data={catalog}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { fontSize: 24, fontWeight: "bold", margin: 16, color: colors.text },
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.imagePlaceholder },
  infoContainer: { marginLeft: 16, justifyContent: "center", flex: 1 },
  title: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 4 },
  muscle: { fontSize: 14, color: colors.textSecondary },
});