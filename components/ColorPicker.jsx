import { View, StyleSheet, Text, Pressable, TextInput } from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

const hsvToRgb = (h, s, v) => {
  s /= 100;
  v /= 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const rgbToHex = ({ r, g, b }) => {
  return (
    "#" +
    [r, g, b]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
};

const hsvToHex = (h, s, v) => {
  return rgbToHex(hsvToRgb(h, s, v));
};

const hexToRgb = (hex) => {
  const cleaned = hex.replace("#", "");

  if (!/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
    return null;
  }

  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  };
};

const rgbToHsv = ({ r, g, b }) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  if (h < 0) {
    h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return {
    h,
    s: s * 100,
    v: v * 100,
  };
};

const ColorPicker = ({ setState, onSelectColor, initialColor = "#FFFFFF" }) => {
  const initialHSV = rgbToHsv(
    hexToRgb(initialColor) || {
      r: 255,
      g: 255,
      b: 255,
    },
  );

  const [hue, setHue] = useState(initialHSV.h);
  const [saturation, setSaturation] = useState(initialHSV.s);
  const [value, setValue] = useState(initialHSV.v);

  const [hexInput, setHexInput] = useState(initialColor.toUpperCase());

  const [pickerSize, setPickerSize] = useState({
    width: 1,
    height: 1,
  });

  const [hueWidth, setHueWidth] = useState(1);

  const currentColor = hsvToHex(hue, saturation, value);

  const hueColor = hsvToHex(hue, 100, 100);

  const emitColor = (h, s, v) => {
    const color = hsvToHex(h, s, v);

    setHexInput(color);

    if (onSelectColor) {
      onSelectColor(color);
    }
  };

  const handleSVTouch = (event) => {
    const { locationX, locationY } = event.nativeEvent;

    const x = clamp(locationX, 0, pickerSize.width);

    const y = clamp(locationY, 0, pickerSize.height);

    const newSaturation = (x / pickerSize.width) * 100;

    const newValue = 100 - (y / pickerSize.height) * 100;

    setSaturation(newSaturation);
    setValue(newValue);

    emitColor(hue, newSaturation, newValue);
  };

  const handleHueTouch = (event) => {
    const { locationX } = event.nativeEvent;

    const x = clamp(locationX, 0, hueWidth);

    let newHue = (x / hueWidth) * 360;

    if (newHue >= 360) {
      newHue = 359.999;
    }

    setHue(newHue);

    emitColor(newHue, saturation, value);
  };

  const applyHexInput = () => {
    let formatted = hexInput.trim();

    if (!formatted.startsWith("#")) {
      formatted = "#" + formatted;
    }

    const rgb = hexToRgb(formatted);

    if (!rgb) {
      setHexInput(currentColor);
      return;
    }

    const hsv = rgbToHsv(rgb);

    setHue(hsv.h);
    setSaturation(hsv.s);
    setValue(hsv.v);

    const normalized = rgbToHex(rgb);

    setHexInput(normalized);

    if (onSelectColor) {
      onSelectColor(normalized);
    }
  };

  const handleDone = () => {
    if (onSelectColor) {
      onSelectColor(currentColor);
    }

    setState(false);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.title}>Text Color</Text>

        <Pressable onPress={() => setState(false)} hitSlop={15}>
          <Text style={styles.close}>×</Text>
        </Pressable>
      </View>

      {/* SATURATION / VALUE PICKER */}

      <View
        style={[
          styles.svPicker,
          {
            backgroundColor: hueColor,
          },
        ]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;

          setPickerSize({
            width,
            height,
          });
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleSVTouch}
        onResponderMove={handleSVTouch}
      >
        {/* White -> transparent */}

        <LinearGradient
          colors={["#FFFFFF", "rgba(255,255,255,0)"]}
          start={{
            x: 0,
            y: 0.5,
          }}
          end={{
            x: 1,
            y: 0.5,
          }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Transparent -> black */}

        <LinearGradient
          colors={["rgba(0,0,0,0)", "#000000"]}
          start={{
            x: 0.5,
            y: 0,
          }}
          end={{
            x: 0.5,
            y: 1,
          }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* SELECTION INDICATOR */}

        <View
          pointerEvents="none"
          style={[
            styles.svIndicator,
            {
              left: (saturation / 100) * pickerSize.width - 9,

              top: ((100 - value) / 100) * pickerSize.height - 9,
            },
          ]}
        />
      </View>

      {/* HUE BAR */}

      <View
        style={styles.hueContainer}
        onLayout={(event) => {
          setHueWidth(event.nativeEvent.layout.width);
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleHueTouch}
        onResponderMove={handleHueTouch}
      >
        <LinearGradient
          colors={[
            "#FF0000",
            "#FFFF00",
            "#00FF00",
            "#00FFFF",
            "#0000FF",
            "#FF00FF",
            "#FF0000",
          ]}
          start={{
            x: 0,
            y: 0.5,
          }}
          end={{
            x: 1,
            y: 0.5,
          }}
          style={styles.hueGradient}
          pointerEvents="none"
        />

        <View
          pointerEvents="none"
          style={[
            styles.hueIndicator,
            {
              left: (hue / 360) * hueWidth - 4,
            },
          ]}
        />
      </View>

      {/* COLOR INFO */}

      <View style={styles.colorInfo}>
        <View
          style={[
            styles.preview,
            {
              backgroundColor: currentColor,
            },
          ]}
        />

        <View style={styles.hexArea}>
          <Text style={styles.label}>HEX</Text>

          <TextInput
            value={hexInput}
            onChangeText={setHexInput}
            onBlur={applyHexInput}
            onSubmitEditing={applyHexInput}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            selectTextOnFocus
            style={styles.hexInput}
          />
        </View>
      </View>

      {/* OPTIONAL COLOR DETAILS */}

      <View style={styles.details}>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>H</Text>
          <Text style={styles.detailValue}>{Math.round(hue)}°</Text>
        </View>

        <View style={styles.detail}>
          <Text style={styles.detailLabel}>S</Text>
          <Text style={styles.detailValue}>{Math.round(saturation)}%</Text>
        </View>

        <View style={styles.detail}>
          <Text style={styles.detailLabel}>B</Text>
          <Text style={styles.detailValue}>{Math.round(value)}%</Text>
        </View>
      </View>

      {/* DONE */}

      <Pressable style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
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

    backgroundColor: "#222",

    borderRadius: 10,

    elevation: 10,

    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    zIndex: 1000,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 12,
  },

  title: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },

  close: {
    color: "#AAA",
    fontSize: 30,
    lineHeight: 30,
  },

  svPicker: {
    width: "100%",
    height: 210,

    borderRadius: 8,
    overflow: "hidden",

    position: "relative",
  },

  svIndicator: {
    position: "absolute",

    width: 18,
    height: 18,

    borderRadius: 9,

    borderWidth: 2,
    borderColor: "#FFF",

    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 2,
    shadowOffset: {
      width: 0,
      height: 1,
    },

    elevation: 5,
  },

  hueContainer: {
    height: 26,

    marginTop: 14,

    position: "relative",

    justifyContent: "center",
  },

  hueGradient: {
    width: "100%",
    height: 14,

    borderRadius: 7,
  },

  hueIndicator: {
    position: "absolute",

    width: 8,
    height: 24,

    borderRadius: 4,

    borderWidth: 2,
    borderColor: "#FFF",

    backgroundColor: "rgba(255,255,255,0.15)",

    top: 1,

    elevation: 4,
  },

  colorInfo: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 16,
  },

  preview: {
    width: 48,
    height: 48,

    borderRadius: 8,

    borderWidth: 1,
    borderColor: "#555",
  },

  hexArea: {
    flex: 1,

    marginLeft: 12,
  },

  label: {
    color: "#888",

    fontSize: 11,
    fontWeight: "600",

    marginBottom: 4,
  },

  hexInput: {
    height: 44,

    paddingHorizontal: 12,

    borderRadius: 7,

    backgroundColor: "#333",

    color: "#FFF",

    fontSize: 16,
    fontWeight: "500",
  },

  details: {
    flexDirection: "row",

    marginTop: 12,

    gap: 8,
  },

  detail: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#2D2D2D",

    borderRadius: 6,

    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  detailLabel: {
    color: "#777",

    fontSize: 12,
    fontWeight: "600",
  },

  detailValue: {
    color: "#DDD",

    fontSize: 12,
  },

  doneButton: {
    marginTop: 14,

    height: 44,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",

    borderRadius: 7,
  },

  doneText: {
    color: "#111",

    fontSize: 15,
    fontWeight: "700",
  },
});

export default ColorPicker;
