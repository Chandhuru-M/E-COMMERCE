import {Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, login } from '../../actions/userActions';
import MetaData from '../layouts/MetaData';
import { toast } from 'react-toastify';
import { Link, useLocation, useNavigate } from 'react-router-dom';
 export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, error, isAuthenticated } = useSelector(state => state.authState)
    const redirect = location.search?'/'+location.search.split('=')[1]:'/';

    const  submitHandler = (e) => {
        e.preventDefault();
        dispatch(login(email, password))
    }

    useEffect(() => {
        if(isAuthenticated) {
            navigate(redirect)
        }

        if(error)  {
            toast(error, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error',
                onOpen: ()=> { dispatch(clearAuthError) }
            })
            return
        }
    },[error, isAuthenticated, dispatch, navigate])

    return (
        <Fragment>
            <MetaData title={`Login`} />
            <div className="row wrapper"> 
                <div className="col-10 col-lg-5">
                    <form onSubmit={submitHandler} className="shadow-lg">
                        <h1 className="mb-3">Login</h1>
                        <div className="form-group">
                            <label htmlFor="email_field">Email</label>
                            <input
                                type="email"
                                id="email_field"
                                className="form-control"
                                value={email}
                                onChange={e =>setEmail(e.target.value)}
                            />
                        </div>
            
                        <div className="form-group">
                            <label htmlFor="password_field">Password</label>
                            <input
                                type="password"
                                id="password_field"
                                className="form-control"
                                value={password}
                                onChange={e =>setPassword(e.target.value)}
                            />
                        </div>

                        <div className="d-flex justify-content-end">
                            <Link to="/password/forgot" className="mb-2">Forgot Password?</Link>
                        </div>
            
                        <button
                            id="login_button"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={loading}
                        >
                            LOGIN
                        </button>

                        <div className="d-flex justify-content-center mt-2">
                            <Link to="/register">New User? Register Here</Link>
                        </div>
                    </form>

                    <div className="text-center mt-4 p-3 border-top">
                        <p className="text-muted mb-2"><i className="fa fa-store"></i> Want to sell with us?</p>
                        <Link to="/merchant/request" className="btn btn-outline-primary btn-sm">
                            <i className="fa fa-handshake mr-2"></i> Become a Merchant
                        </Link>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}