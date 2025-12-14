import {useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function Profile () {
    const { user }  = useSelector(state => state.authState);

    if (!user) {
        return <div className="text-center mt-5">Loading...</div>;
    }

    return (
        <div className="row justify-content-around mt-5 user-info">
            <div className="col-12 col-md-3">
                <figure className='avatar avatar-profile'>
                    <img className="rounded-circle img-fluid" src={user.avatar??'./images/default_avatar.png'} alt='' />
                </figure>
                <Link to="/myprofile/update" id="edit_profile" className="btn btn-primary btn-block my-5">
                    Edit Profile
                </Link>
            </div>
    
            <div className="col-12 col-md-5">
                <h4>Full Name</h4>
                <p>{user.name}</p>
    
                <h4>Email Address</h4>
                <p>{user.email}</p>

                <h4>Joined</h4>
                <p>{String(user.createdAt).substring(0, 10)}</p>

                {user._id && (
                    <div className="alert alert-info mt-3">
                        <strong>User ID:</strong> {user._id}
                    </div>
                )}

                <Link to="/orders" className="btn btn-danger btn-block mt-5">
                    My Orders
                </Link>

                <Link to="/myprofile/update/password" className="btn btn-primary btn-block mt-3">
                    Change Password
                </Link>

                {user._id ? (
                    <a 
                        href={`https://t.me/shop_assistant_123_bot?start=${user._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-success btn-block mt-3"
                    >
                        💬 Connect Telegram
                    </a>
                ) : (
                    <button className="btn btn-secondary btn-block mt-3" disabled>
                        💬 Connect Telegram (User ID not available)
                    </button>
                )}
            </div>
        </div>
    )
}