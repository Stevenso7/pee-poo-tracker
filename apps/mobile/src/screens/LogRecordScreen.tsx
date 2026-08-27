import { type Screen } from '../../App';
import PeeLogForm from './PeeLogForm';
import PooLogForm from './PooLogForm';

type Props = { type: 'PEE' | 'POO'; navigate: (s: Screen) => void };

export default function LogRecordScreen({ type, navigate }: Props) {
	if (type === 'PEE') {
		return <PeeLogForm navigate={navigate} />;
	}
	return <PooLogForm navigate={navigate} />;
}
