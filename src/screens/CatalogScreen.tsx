import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
} from "react-native";

// Importamos tus datos locales
import catalog from "../assets/data/catalogo_app.json";
import { imageMap } from "../assets/imgs/imageMap";

import { ListRenderItem } from "react-native";

type Exercise = {
  id: string;
  name: string;
  muscle: string;
  image: string;
};

export default function CatalogScreen() {
  //Func para cada tarjeta de ejecrcicio
  const renderItem: ListRenderItem<Exercise> = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={imageMap[item.id as keyof typeof imageMap]}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.muscle}>{item.muscle}</Text>
      </View>
    </View>
  );

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    margin: 16,
    color: "#333",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    elevation: 2, //Sombra en Android
    shadowColor: "#000", //Sombras en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#EAEAEA", //Fondo gris mientras carga
  },
  infoContainer: {
    marginLeft: 16,
    justifyContent: "center",
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  muscle: {
    fontSize: 14,
    color: "#666",
  },
});
