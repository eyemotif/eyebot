import { sub } from '../events'

sub(listener =>
    listener
        .onChannelPointReward('eye_motif', 'test', username => console.log(`${username} redeemed "test".`))
)
