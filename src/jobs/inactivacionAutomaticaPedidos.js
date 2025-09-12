import axios from 'axios';
export const inactivacionAutomaticaPedidos = async () => {
    try{
        const response = await axios.post('http://localhost:8000/api/cdi/pedido/inactivacionAutomaticaPedidos/')
        console.log('Respuesta', response.data)
        return response
    }catch (error) {
        console.log('Error en el proceso de inactivación de pedidos', error);
        throw error;
    }
};