import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, View } from "react-native";

export function Wiggle({
	deg,
	duration,
	pause,
	delay,
	style,
	children,
}: {
	deg: number;
	duration: number;
	pause: number;
	delay: number;
	style?: View["props"]["style"];
	children: ReactNode;
}) {
	const v = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const anim = Animated.loop(
			Animated.sequence([
				Animated.delay(delay),
				Animated.timing(v, {
					toValue: 1,
					duration,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: true,
				}),
				Animated.timing(v, {
					toValue: -1,
					duration: duration * 2,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: true,
				}),
				Animated.timing(v, {
					toValue: 0,
					duration,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: true,
				}),
				Animated.delay(pause),
			]),
		);
		anim.start();
		return () => anim.stop();
	}, [v, delay, duration, pause]);

	const rotate = v.interpolate({
		inputRange: [-1, 1],
		outputRange: [`-${deg}deg`, `${deg}deg`],
	});

	return (
		<Animated.View style={[style, { transform: [{ rotate }] }]}>
			{children}
		</Animated.View>
	);
}

export function Bob({
	dist,
	duration,
	delay,
	style,
	children,
}: {
	dist: number;
	duration: number;
	delay: number;
	style?: View["props"]["style"];
	children: ReactNode;
}) {
	const v = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const anim = Animated.loop(
			Animated.sequence([
				Animated.delay(delay),
				Animated.timing(v, {
					toValue: 1,
					duration,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: true,
				}),
				Animated.timing(v, {
					toValue: 0,
					duration,
					easing: Easing.inOut(Easing.quad),
					useNativeDriver: true,
				}),
			]),
		);
		anim.start();
		return () => anim.stop();
	}, [v, delay, duration]);

	const translateY = v.interpolate({
		inputRange: [0, 1],
		outputRange: [0, -dist],
	});

	return (
		<Animated.View style={[style, { transform: [{ translateY }] }]}>
			{children}
		</Animated.View>
	);
}

export function Pop({
	selected,
	style,
	children,
}: {
	selected: boolean;
	style?: View["props"]["style"];
	children: ReactNode;
}) {
	const scale = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		if (selected) {
			Animated.sequence([
				Animated.spring(scale, {
					toValue: 1.15,
					friction: 3,
					tension: 180,
					useNativeDriver: true,
				}),
				Animated.spring(scale, {
					toValue: 1,
					friction: 4,
					tension: 160,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [selected, scale]);

	return (
		<Animated.View style={[style, { transform: [{ scale }] }]}>
			{children}
		</Animated.View>
	);
}
