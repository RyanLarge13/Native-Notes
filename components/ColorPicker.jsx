import { View, Text, StyleSheet, PanResponder } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
  Path,
} from "react-native-svg";
import { hsv2rgb } from "../utils/helpers/colorConverter";
import React from "react";

const ColorPicker = ({ setState }) => {
  const size = 200;
  const radius = size / 2;

  const generateColorWheel = () => {
    const segments = 360;
    const paths = [];
    for (let i = 0; i < segments; i++) {
      const startAngle = (i * 2 * Math.PI) / segments;
      const endAngle = ((i + 1) * 2 * Math.PI) / segments;
      const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
      const x1 = radius + radius * Math.cos(startAngle);
      const y1 = radius + radius * Math.sin(startAngle);
      const x2 = radius + radius * Math.cos(endAngle);
      const y2 = radius + radius * Math.sin(endAngle);
      const color = hsv2rgb((i / segments) * 360, 1, 1);
      paths.push(
        <Path
          key={i}
          d={`M ${radius},${radius} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`}
          fill={`rgb(${color.r},${color.g},${color.b})`}
        />
      );
    }
    return paths;
  };

  return (
    <View style={styles.container}>
      <Svg height={size} width={size}>
        <G>{generateColorWheel()}</G>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path
          d={`M ${radius},${radius} m -${radius},0 a ${radius},${radius} 0 1,0 ${
            radius * 2
          },0 a ${radius},${radius} 0 1,0 -${radius * 2},0`}
          fill="url(#grad)"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    position: "absolute",
    bottom: 50,
    right: 5,
    left: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 10,
    elevation: 5,
  },
});

export default ColorPicker;
